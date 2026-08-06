/**
 * Hermetic tests for the msgpack encoder + Hyperliquid EIP-712 signing wrapper.
 * No network.
 *
 * The msgpack vectors below are hand-computed from the canonical msgpack spec
 * (they match Python's `msgpack.packb`, which is what the HL SDK uses). The
 * signL1Action tests can only assert INTERNAL properties — determinism, correct
 * signer recovery, and sensitivity to each input — because the exact HL wire
 * scheme is unverifiable offline (see the TODO(hl-verify) markers in eip712.ts).
 */
import { describe, expect, it } from "vitest";
import { bytesToHex, recoverAddress, privateKeyToAddress, keccak256 } from "./crypto";
import {
  encodeMsgpack,
  domainSeparator,
  agentDigest,
  actionHash,
  signL1Action,
  HL_AGENT_SOURCE_MAINNET,
  HL_AGENT_SOURCE_TESTNET,
  type MsgpackValue,
} from "./eip712";

const hex = (v: MsgpackValue) => bytesToHex(encodeMsgpack(v));

describe("msgpack encoder", () => {
  it("encodes nil / bool", () => {
    expect(hex(null)).toBe("c0");
    expect(hex(false)).toBe("c2");
    expect(hex(true)).toBe("c3");
  });

  it("encodes positive fixint and uint widths", () => {
    expect(hex(0)).toBe("00");
    expect(hex(127)).toBe("7f");
    expect(hex(128)).toBe("cc80"); // uint8
    expect(hex(255)).toBe("ccff");
    expect(hex(256)).toBe("cd0100"); // uint16
    expect(hex(65536)).toBe("ce00010000"); // uint32
    expect(hex(4294967296n)).toBe("cf0000000100000000"); // uint64
  });

  it("encodes negative fixint and int widths", () => {
    expect(hex(-1)).toBe("ff");
    expect(hex(-32)).toBe("e0");
    expect(hex(-33)).toBe("d0df"); // int8
    expect(hex(-128)).toBe("d080");
    expect(hex(-129)).toBe("d1ff7f"); // int16
  });

  it("encodes fixstr", () => {
    expect(hex("")).toBe("a0");
    expect(hex("a")).toBe("a161");
    expect(hex("abc")).toBe("a3616263");
  });

  it("encodes str8 at the 32-byte boundary", () => {
    // 32 chars -> too big for fixstr(<32), uses str8 (0xd9, len 0x20).
    const s = "a".repeat(32);
    expect(hex(s)).toBe("d920" + "61".repeat(32));
  });

  it("encodes fixarray and fixmap in insertion order", () => {
    expect(hex([])).toBe("90");
    expect(hex(["a", 1])).toBe("92a16101");
    expect(hex({})).toBe("80");
    expect(hex({ a: 1 })).toBe("81a16101");
    // Order matters: the map is emitted in object-key insertion order.
    expect(hex({ b: 2, a: 1 })).toBe("82a16202a16101");
  });

  it("encodes bin8", () => {
    expect(hex(new Uint8Array([0xde, 0xad]))).toBe("c402dead");
  });

  it("encodes a HL-shaped order action deterministically", () => {
    // A representative exchange order action. Byte-stable == hash-stable.
    const action: MsgpackValue = {
      type: "order",
      orders: [{ a: 0, b: true, p: "10000", s: "0.1", r: false, t: { limit: { tif: "Gtc" } } }],
      grouping: "na",
    };
    expect(hex(action)).toBe(hex(action)); // deterministic
    expect(encodeMsgpack(action).length).toBeGreaterThan(0);
  });
});

describe("EIP-712 domain / agent hashing", () => {
  it("has a stable domain separator", () => {
    const a = bytesToHex(domainSeparator());
    expect(a).toBe(bytesToHex(domainSeparator()));
    expect(a.length).toBe(64); // 32 bytes
  });

  it("produces a 32-byte agent digest that depends on the connectionId", () => {
    const cid1 = keccak256(new TextEncoder().encode("action-1"));
    const cid2 = keccak256(new TextEncoder().encode("action-2"));
    const d1 = agentDigest({ source: HL_AGENT_SOURCE_MAINNET, connectionId: cid1 });
    const d2 = agentDigest({ source: HL_AGENT_SOURCE_MAINNET, connectionId: cid2 });
    expect(d1.length).toBe(32);
    expect(bytesToHex(d1)).not.toBe(bytesToHex(d2));
  });

  it("mainnet and testnet agents hash differently (source a vs b)", () => {
    const cid = keccak256(new TextEncoder().encode("same-action"));
    const main = agentDigest({ source: HL_AGENT_SOURCE_MAINNET, connectionId: cid });
    const test = agentDigest({ source: HL_AGENT_SOURCE_TESTNET, connectionId: cid });
    expect(bytesToHex(main)).not.toBe(bytesToHex(test));
  });
});

describe("actionHash", () => {
  const action: MsgpackValue = { type: "order", orders: [] };

  it("is deterministic for identical inputs", () => {
    const a = actionHash(action, 1700000000000n, null);
    const b = actionHash(action, 1700000000000n, null);
    expect(bytesToHex(a)).toBe(bytesToHex(b));
  });

  it("changes with the nonce", () => {
    const a = actionHash(action, 1n, null);
    const b = actionHash(action, 2n, null);
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });

  it("changes when a vault address is present (0x00 vs 0x01||addr tag)", () => {
    const noVault = actionHash(action, 1n, null);
    const vault = actionHash(action, 1n, "0x1234567890123456789012345678901234567890");
    expect(bytesToHex(noVault)).not.toBe(bytesToHex(vault));
  });
});

describe("signL1Action", () => {
  const PRIV = "4646464646464646464646464646464646464646464646464646464646464646";
  const action: MsgpackValue = {
    type: "order",
    orders: [{ a: 0, b: true, p: "10000", s: "0.1", r: false, t: { limit: { tif: "Gtc" } } }],
    grouping: "na",
  };

  it("returns hex r/s and v in {27,28}, deterministically", () => {
    const s1 = signL1Action({ action, nonce: 1700000000000, privateKey: PRIV, isMainnet: true });
    const s2 = signL1Action({ action, nonce: 1700000000000, privateKey: PRIV, isMainnet: true });
    expect(s1).toEqual(s2);
    expect(s1.r).toMatch(/^0x[0-9a-f]{64}$/);
    expect(s1.s).toMatch(/^0x[0-9a-f]{64}$/);
    expect([27, 28]).toContain(s1.v);
  });

  it("the signature recovers to the signer's address", () => {
    const nonce = 1700000000000n;
    const sig = signL1Action({ action, nonce, privateKey: PRIV, isMainnet: true });
    // Reconstruct the exact digest the wrapper signed, then ecrecover it.
    const digest = agentDigest({
      source: HL_AGENT_SOURCE_MAINNET,
      connectionId: actionHash(action, nonce, null),
    });
    const recovered = recoverAddress(digest, {
      r: BigInt(sig.r),
      s: BigInt(sig.s),
      recovery: sig.v - 27,
    });
    expect(recovered).toBe(privateKeyToAddress(PRIV));
  });

  it("mainnet vs testnet yield different signatures for the same action", () => {
    const main = signL1Action({ action, nonce: 1n, privateKey: PRIV, isMainnet: true });
    const test = signL1Action({ action, nonce: 1n, privateKey: PRIV, isMainnet: false });
    expect(main).not.toEqual(test);
  });

  it("a vault address changes the signature", () => {
    const plain = signL1Action({ action, nonce: 1n, privateKey: PRIV, isMainnet: true });
    const vault = signL1Action({
      action,
      nonce: 1n,
      privateKey: PRIV,
      isMainnet: true,
      vaultAddress: "0x" + "ab".repeat(20),
    });
    expect(plain).not.toEqual(vault);
  });
});
