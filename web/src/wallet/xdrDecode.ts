/**
 * Decode an unsigned/signed transaction XDR into human-readable rows for the
 * TxReviewDialog, so the user can see EXACTLY what they are about to sign. Shows
 * full, unelided destination addresses on purpose (address-poisoning phishing
 * relies on truncation — see the engineering plan §8.5).
 */
import { TransactionBuilder, type Transaction, type Operation } from "@stellar/stellar-base";

export interface TxField {
  label: string;
  value: string;
}
export interface TxOpRow {
  type: string;
  fields: TxField[];
}
export interface DecodedTx {
  source: string;
  fee: string;
  sequence: string;
  memo: string | null;
  ops: TxOpRow[];
}

/** Duck-typed asset label ("XLM" or "CODE:ISSUER") tolerant of Asset vs
 *  LiquidityPoolAsset without fighting the union type. */
function assetLabel(a: unknown): string {
  const x = a as {
    isNative?: () => boolean;
    getCode?: () => string;
    getIssuer?: () => string;
    code?: string;
    issuer?: string;
  };
  try {
    if (x.isNative?.()) return "XLM";
  } catch {
    /* not a plain asset */
  }
  const code = x.getCode?.() ?? x.code ?? "asset";
  const issuer = x.getIssuer?.() ?? x.issuer;
  return issuer ? `${code}:${issuer}` : String(code);
}

function opRow(op: Operation): TxOpRow {
  const fields: TxField[] = [];
  const push = (label: string, value: unknown): void => {
    if (value !== undefined && value !== null && value !== "") fields.push({ label, value: String(value) });
  };
  switch (op.type) {
    case "payment":
      push("To", op.destination);
      push("Asset", assetLabel(op.asset));
      push("Amount", op.amount);
      break;
    case "pathPaymentStrictSend":
      push("Send", `${op.sendAmount} ${assetLabel(op.sendAsset)}`);
      push("To", op.destination);
      push("Receive at least", `${op.destMin} ${assetLabel(op.destAsset)}`);
      break;
    case "pathPaymentStrictReceive":
      push("Send at most", `${op.sendMax} ${assetLabel(op.sendAsset)}`);
      push("To", op.destination);
      push("Receive", `${op.destAmount} ${assetLabel(op.destAsset)}`);
      break;
    case "manageSellOffer":
    case "createPassiveSellOffer":
      push("Sell", `${op.amount} ${assetLabel(op.selling)}`);
      push("For", assetLabel(op.buying));
      push("Price", op.price);
      break;
    case "manageBuyOffer":
      push("Buy", `${op.buyAmount} ${assetLabel(op.buying)}`);
      push("With", assetLabel(op.selling));
      push("Price", op.price);
      break;
    case "changeTrust":
      push("Trust asset", assetLabel(op.line));
      push("Limit", op.limit);
      break;
    case "claimClaimableBalance":
      push("Balance id", op.balanceId);
      break;
    default:
      break;
  }
  return { type: op.type, fields };
}

export function decodeXdr(xdr: string, networkPassphrase: string): DecodedTx {
  const parsed = TransactionBuilder.fromXDR(xdr, networkPassphrase);
  if ("innerTransaction" in parsed) {
    throw new Error("Fee-bump envelopes cannot be reviewed here.");
  }
  const tx: Transaction = parsed;
  let memo: string | null = null;
  const memoVal = (tx.memo as { value?: unknown } | undefined)?.value;
  if (memoVal != null && memoVal !== "") memo = String(memoVal);
  return {
    source: tx.source,
    fee: tx.fee,
    sequence: tx.sequence,
    memo,
    ops: tx.operations.map(opRow),
  };
}
