import { describe, it, expect } from "vitest";
import { Keypair, TransactionBuilder, Account, Operation, Asset } from "@stellar/stellar-sdk";
import { config } from "../config";
import { parseSignedTx } from "./clientSign";

// Build + sign a transaction on the CONFIGURED network so parseSignedTx (which
// parses with config.networkPassphrase) always matches, regardless of NETWORK.
function buildSignedXdr(
  sourceKp: Keypair,
  ops: Parameters<TransactionBuilder["addOperation"]>[0][],
): string {
  const acct = new Account(sourceKp.publicKey(), "100");
  const b = new TransactionBuilder(acct, { fee: "100", networkPassphrase: config.networkPassphrase });
  for (const op of ops) b.addOperation(op);
  const tx = b.setTimeout(120).build();
  tx.sign(sourceKp);
  return tx.toXDR();
}

describe("clientSign.parseSignedTx — non-custodial /submit trust boundary", () => {
  const kp = Keypair.random();
  const account = kp.publicKey();

  it("accepts a well-formed payment from the expected account and sums egress", () => {
    const xdr = buildSignedXdr(kp, [
      Operation.payment({ destination: Keypair.random().publicKey(), asset: Asset.native(), amount: "5" }),
    ]);
    const p = parseSignedTx(xdr, account);
    expect(p.tx.source).toBe(account);
    expect(p.egressAmount).toBe(5);
    expect(p.egressAssets.length).toBe(1);
  });

  it("REFUSES a transaction whose source is not the expected account", () => {
    const attacker = Keypair.random();
    const xdr = buildSignedXdr(attacker, [
      Operation.payment({ destination: Keypair.random().publicKey(), asset: Asset.native(), amount: "1" }),
    ]);
    expect(() => parseSignedTx(xdr, account)).toThrow(/source account/i);
  });

  it("REFUSES a blocked operation type (account-takeover setOptions)", () => {
    const xdr = buildSignedXdr(kp, [Operation.setOptions({ homeDomain: "evil.example" })]);
    expect(() => parseSignedTx(xdr, account)).toThrow(/not permitted/i);
  });

  it("REFUSES a per-operation source override", () => {
    const xdr = buildSignedXdr(kp, [
      Operation.payment({
        source: Keypair.random().publicKey(),
        destination: Keypair.random().publicKey(),
        asset: Asset.native(),
        amount: "1",
      }),
    ]);
    expect(() => parseSignedTx(xdr, account)).toThrow(/source override/i);
  });

  it("REFUSES unparseable XDR", () => {
    expect(() => parseSignedTx("definitely-not-xdr", account)).toThrow(/parse/i);
  });
});
