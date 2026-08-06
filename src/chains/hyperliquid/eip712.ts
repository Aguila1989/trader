/**
 * Hyperliquid L1-action signing: msgpack action encoding + EIP-712 typed-data
 * hashing + the "agent" wrapper (Phase 2a).
 *
 * HOW HYPERLIQUID SIGNS AN EXCHANGE ACTION (reconstructed from the public
 * Python SDK — every wire-format detail below is marked `TODO(hl-verify)` and
 * MUST be confirmed against testnet before any real order is signed):
 *
 *   1. actionHash = keccak256( msgpack(action) ‖ nonce(u64 BE)
 *                              ‖ vaultTag ‖ [expiresAfterTag] )
 *        vaultTag        = 0x00                    when no vault
 *                        = 0x01 ‖ address(20 bytes) when trading for a vault
 *        expiresAfterTag = (omitted)               when no expiry
 *                        = 0x00 ‖ expiresAfter(u64 BE) when set (newer field)
 *   2. phantomAgent = { source: "a" (mainnet) | "b" (testnet),
 *                       connectionId: actionHash }
 *   3. Sign the EIP-712 typed data for the `Agent` struct under a FIXED domain
 *        { name:"Exchange", version:"1", chainId:1337, verifyingContract:0x0 }
 *      i.e. digest = keccak256( 0x1901 ‖ domainSeparator ‖ hashStruct(agent) ).
 *   4. Submit { r, s, v } with v ∈ {27, 28}.
 *
 * Note the domain chainId (1337) is a HL signing constant, NOT the chain the
 * asset lives on — do not confuse it with an EVM network id. Every HL-specific
 * constant is a NAMED export so a wrong value is a one-line fix.
 *
 * Pure/offline: no network, no import-time side effects.
 */
import {
  bigIntToBytes,
  bytesToHex,
  hexToBytes,
  keccak256,
  sign,
  type Signature,
} from "./crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal msgpack encoder — exactly the types a HL action object uses.
// (str / int / float / bool / nil / array / map / bin.) Matches the canonical
// msgpack spec and Python's `msgpack.packb` smallest-encoding behaviour, which
// is what the HL Python SDK uses to produce the bytes that get hashed.
// ─────────────────────────────────────────────────────────────────────────────

export type MsgpackValue =
  | null
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | MsgpackValue[]
  | { [key: string]: MsgpackValue };

class ByteWriter {
  private bytes: number[] = [];
  u8(v: number): void {
    this.bytes.push(v & 0xff);
  }
  push(vals: Uint8Array): void {
    for (let i = 0; i < vals.length; i++) this.bytes.push(vals[i] as number);
  }
  /** Big-endian unsigned integer of `n` bytes. */
  uint(value: bigint, n: number): void {
    for (let i = n - 1; i >= 0; i--) this.bytes.push(Number((value >> BigInt(8 * i)) & 0xffn));
  }
  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

const UTF8 = new TextEncoder();

function encodeInt(w: ByteWriter, value: bigint): void {
  // Positive: positive-fixint then uint8/16/32/64. Negative: negative-fixint
  // then int8/16/32/64. Mirrors Python msgpack's choice of the smallest form.
  if (value >= 0n) {
    if (value < 0x80n) w.u8(Number(value)); // positive fixint
    else if (value < 0x100n) {
      w.u8(0xcc);
      w.uint(value, 1);
    } else if (value < 0x10000n) {
      w.u8(0xcd);
      w.uint(value, 2);
    } else if (value < 0x100000000n) {
      w.u8(0xce);
      w.uint(value, 4);
    } else if (value < 0x10000000000000000n) {
      w.u8(0xcf);
      w.uint(value, 8);
    } else {
      throw new Error("msgpack: uint exceeds 64 bits");
    }
  } else {
    if (value >= -0x20n) w.u8(0xe0 | (Number(value) & 0x1f)); // negative fixint
    else if (value >= -0x80n) {
      w.u8(0xd0);
      w.uint(value & 0xffn, 1);
    } else if (value >= -0x8000n) {
      w.u8(0xd1);
      w.uint(value & 0xffffn, 2);
    } else if (value >= -0x80000000n) {
      w.u8(0xd2);
      w.uint(value & 0xffffffffn, 4);
    } else if (value >= -0x8000000000000000n) {
      w.u8(0xd3);
      w.uint(value & 0xffffffffffffffffn, 8);
    } else {
      throw new Error("msgpack: int exceeds 64 bits");
    }
  }
}

function encodeValue(w: ByteWriter, value: MsgpackValue): void {
  if (value === null) {
    w.u8(0xc0);
    return;
  }
  if (typeof value === "boolean") {
    w.u8(value ? 0xc3 : 0xc2);
    return;
  }
  if (typeof value === "bigint") {
    encodeInt(w, value);
    return;
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      encodeInt(w, BigInt(value));
    } else {
      // float64 (0xcb). HL actions carry prices/sizes as STRINGS, so a bare
      // float should not normally occur; supported for completeness.
      // TODO(hl-verify): confirm no action field is ever a raw msgpack float.
      w.u8(0xcb);
      const buf = new ArrayBuffer(8);
      new DataView(buf).setFloat64(0, value, false); // big-endian
      w.push(new Uint8Array(buf));
    }
    return;
  }
  if (typeof value === "string") {
    const bytes = UTF8.encode(value);
    const n = bytes.length;
    if (n < 0x20) w.u8(0xa0 | n); // fixstr
    else if (n < 0x100) {
      w.u8(0xd9);
      w.uint(BigInt(n), 1);
    } else if (n < 0x10000) {
      w.u8(0xda);
      w.uint(BigInt(n), 2);
    } else {
      w.u8(0xdb);
      w.uint(BigInt(n), 4);
    }
    w.push(bytes);
    return;
  }
  if (value instanceof Uint8Array) {
    const n = value.length;
    if (n < 0x100) {
      w.u8(0xc4);
      w.uint(BigInt(n), 1);
    } else if (n < 0x10000) {
      w.u8(0xc5);
      w.uint(BigInt(n), 2);
    } else {
      w.u8(0xc6);
      w.uint(BigInt(n), 4);
    }
    w.push(value);
    return;
  }
  if (Array.isArray(value)) {
    const n = value.length;
    if (n < 0x10) w.u8(0x90 | n); // fixarray
    else if (n < 0x10000) {
      w.u8(0xdc);
      w.uint(BigInt(n), 2);
    } else {
      w.u8(0xdd);
      w.uint(BigInt(n), 4);
    }
    for (const item of value) encodeValue(w, item);
    return;
  }
  // Plain object -> map. Keys are emitted in INSERTION ORDER — the caller MUST
  // build the action with keys in HL's canonical order, exactly as the Python
  // SDK's dict literal does, since the hash is order-sensitive.
  // TODO(hl-verify): confirm per-action key ordering matches the HL SDK.
  const keys = Object.keys(value);
  // JS emits integer-like string keys ("0","1",...) in ascending NUMERIC order
  // ahead of insertion-ordered keys, which would silently reorder the map and
  // corrupt the order-sensitive action hash. HL actions never use numeric-string
  // keys; refuse them loudly rather than mis-encode. (Review 2026-08-04, P2.)
  for (const k of keys) {
    if (/^(0|[1-9][0-9]*)$/.test(k)) {
      throw new Error("msgpack: integer-like map keys are unsupported (JS would reorder them)");
    }
  }
  const n = keys.length;
  if (n < 0x10) w.u8(0x80 | n); // fixmap
  else if (n < 0x10000) {
    w.u8(0xde);
    w.uint(BigInt(n), 2);
  } else {
    w.u8(0xdf);
    w.uint(BigInt(n), 4);
  }
  for (const key of keys) {
    encodeValue(w, key);
    encodeValue(w, value[key] as MsgpackValue);
  }
}

/** Encode a value to msgpack bytes. */
export function encodeMsgpack(value: MsgpackValue): Uint8Array {
  const w = new ByteWriter();
  encodeValue(w, value);
  return w.toBytes();
}

// ─────────────────────────────────────────────────────────────────────────────
// Hyperliquid signing constants — each a NAMED export so a wrong value is a
// single-line fix. ALL are TODO(hl-verify) against testnet.
// ─────────────────────────────────────────────────────────────────────────────

/** EIP-712 domain name for L1 actions. TODO(hl-verify). */
export const HL_EIP712_DOMAIN_NAME = "Exchange";
/** EIP-712 domain version. TODO(hl-verify). */
export const HL_EIP712_DOMAIN_VERSION = "1";
/** EIP-712 domain chainId for L1 actions — a HL SIGNING constant (0x539), NOT
 *  an EVM network id. TODO(hl-verify). */
export const HL_SIGNATURE_CHAIN_ID = 1337n;
/** EIP-712 verifyingContract — the zero address for HL L1 actions. TODO(hl-verify). */
export const HL_VERIFYING_CONTRACT = "0x0000000000000000000000000000000000000000";
/** phantomAgent.source for mainnet. TODO(hl-verify). */
export const HL_AGENT_SOURCE_MAINNET = "a";
/** phantomAgent.source for testnet. TODO(hl-verify). */
export const HL_AGENT_SOURCE_TESTNET = "b";

// EIP-712 type hashes (keccak of the canonical type strings).
const EIP712_DOMAIN_TYPEHASH = keccak256(
  UTF8.encode("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
);
const AGENT_TYPEHASH = keccak256(UTF8.encode("Agent(string source,bytes32 connectionId)"));

function u256(value: bigint): Uint8Array {
  return bigIntToBytes(value, 32);
}
/** Left-pad a 20-byte address to a 32-byte EIP-712 word. */
function addressWord(address: string): Uint8Array {
  const raw = hexToBytes(address);
  if (raw.length !== 20) throw new Error(`address must be 20 bytes, got ${raw.length}`);
  const out = new Uint8Array(32);
  out.set(raw, 12);
  return out;
}
function cat(...parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** EIP-712 domain separator for the fixed HL Exchange domain. */
export function domainSeparator(): Uint8Array {
  return keccak256(
    cat(
      EIP712_DOMAIN_TYPEHASH,
      keccak256(UTF8.encode(HL_EIP712_DOMAIN_NAME)),
      keccak256(UTF8.encode(HL_EIP712_DOMAIN_VERSION)),
      u256(HL_SIGNATURE_CHAIN_ID),
      addressWord(HL_VERIFYING_CONTRACT),
    ),
  );
}

export interface PhantomAgent {
  source: string;
  /** 32-byte connectionId (the action hash). */
  connectionId: Uint8Array;
}

/** hashStruct(Agent) = keccak256(typeHash ‖ keccak256(source) ‖ connectionId). */
export function hashAgentStruct(agent: PhantomAgent): Uint8Array {
  if (agent.connectionId.length !== 32) throw new Error("connectionId must be 32 bytes");
  return keccak256(cat(AGENT_TYPEHASH, keccak256(UTF8.encode(agent.source)), agent.connectionId));
}

/** Full EIP-712 digest: keccak256(0x1901 ‖ domainSeparator ‖ hashStruct). */
export function agentDigest(agent: PhantomAgent): Uint8Array {
  return keccak256(cat(new Uint8Array([0x19, 0x01]), domainSeparator(), hashAgentStruct(agent)));
}

/**
 * Hyperliquid action hash: keccak256 over the msgpack-encoded action, the u64
 * big-endian nonce, the vault tag, and an optional expiresAfter tag. This is
 * the value that becomes the phantomAgent.connectionId.
 */
export function actionHash(
  action: MsgpackValue,
  nonce: bigint,
  vaultAddress: string | null,
  expiresAfter?: bigint,
): Uint8Array {
  const parts: Uint8Array[] = [encodeMsgpack(action), bigIntToBytes(nonce, 8)];
  if (vaultAddress === null || vaultAddress === undefined) {
    parts.push(new Uint8Array([0x00]));
  } else {
    // Validate the vault address is exactly 20 bytes, like addressWord() does —
    // an unchecked length here would sign over a wrong preimage (valid signature,
    // silently-rejected order). (Review 2026-08-04, hl-signing P2.)
    const vaultBytes = hexToBytes(vaultAddress);
    if (vaultBytes.length !== 20) {
      throw new Error("actionHash: vault address must be 20 bytes");
    }
    parts.push(new Uint8Array([0x01]), vaultBytes);
  }
  // TODO(hl-verify): confirm the expiresAfter tag byte (0x00) + u64 layout.
  if (expiresAfter !== undefined) {
    parts.push(new Uint8Array([0x00]), bigIntToBytes(expiresAfter, 8));
  }
  return keccak256(cat(...parts));
}

/** Hyperliquid submission signature: hex r/s and v ∈ {27, 28}. */
export interface HlSignature {
  r: string;
  s: string;
  v: number;
}

function toHlSignature(sig: Signature): HlSignature {
  return {
    r: "0x" + bytesToHex(bigIntToBytes(sig.r, 32)),
    s: "0x" + bytesToHex(bigIntToBytes(sig.s, 32)),
    v: 27 + sig.recovery,
  };
}

export interface L1ActionParams {
  action: MsgpackValue;
  nonce: number | bigint;
  privateKey: string | Uint8Array;
  isMainnet: boolean;
  /** Vault/subaccount address to trade on behalf of, else null/omit. */
  vaultAddress?: string | null;
  /** Optional newer HL field. TODO(hl-verify). */
  expiresAfter?: number | bigint;
}

/**
 * Sign a Hyperliquid L1 (exchange) action. Returns the { r, s, v } to submit.
 * Deterministic for a given (action, nonce, key). See the file header for the
 * exact scheme and its unverified assumptions.
 */
export function signL1Action(params: L1ActionParams): HlSignature {
  const hash = actionHash(
    params.action,
    BigInt(params.nonce),
    params.vaultAddress ?? null,
    params.expiresAfter === undefined ? undefined : BigInt(params.expiresAfter),
  );
  const agent: PhantomAgent = {
    source: params.isMainnet ? HL_AGENT_SOURCE_MAINNET : HL_AGENT_SOURCE_TESTNET,
    connectionId: hash,
  };
  const digest = agentDigest(agent);
  return toHlSignature(sign(digest, params.privateKey));
}
