// Friendly, localized translations for raw error text that would otherwise
// reach the trader unfiltered — Stellar transaction/operation result codes
// (op_underfunded, tx_bad_seq, ...), the generic HTTP-failure text synthesized
// by api.ts's postJSON, and raw browser network errors.
//
// This is a REAL live-mainnet trading app: friendlyError() must never HIDE
// information. Anything it doesn't recognize (including server-provided
// policy-violation text, which is often already the most useful message the
// user can see) is returned UNCHANGED. It never throws.
import i18n from "./i18n";

const NS = "errors";

function t(key: string): string {
  return i18n.global.t(`${NS}.${key}`);
}

interface Rule {
  test: RegExp;
  key: string;
}

// Stellar tx/op result codes -> plain-language copy. Matched as substrings
// (not anchored), so they fire whether the code arrives bare ("op_underfunded"),
// inside a result_codes dump, or embedded in a longer sentence (e.g. a
// buying/selling-liabilities explanation that still contains "underfunded").
// Order matters where codes could otherwise overlap.
const STELLAR_RULES: Rule[] = [
  { test: /no_trust|no_issuer/i, key: "noTrust" },
  { test: /low_reserve/i, key: "lowReserve" },
  { test: /line_full/i, key: "lineFull" },
  { test: /bad_seq/i, key: "badSeq" },
  { test: /insufficient_fee/i, key: "insufficientFee" },
  { test: /no_destination/i, key: "noDestination" },
  { test: /underfunded/i, key: "underfunded" },
];

// The exact bare `${status} ${statusText}` shape api.ts's getJSON() throws on
// a non-2xx response (e.g. "500 Internal Server Error"). Anchored start-to-end
// against a whitelist of real fetch() statusText strings so it can never
// swallow an unrelated message that merely starts with a number.
const BARE_HTTP_STATUS =
  /^(\d{3})\s+(?:OK|Created|Accepted|No Content|Bad Request|Unauthorized|Payment Required|Forbidden|Not Found|Method Not Allowed|Conflict|Too Many Requests|Internal Server Error|Not Implemented|Bad Gateway|Service Unavailable|Gateway Timeout)$/i;

const CHECK_HISTORY_RE = /check (your )?history/i;

/**
 * Translate a raw error/status string into friendly, localized copy.
 *
 * - "" / null / undefined -> "" (nothing to show).
 * - Known Stellar op/tx codes, HTTP-failure patterns, and network errors ->
 *   mapped, localized copy.
 * - Anything else -> the raw string, UNCHANGED.
 */
export function friendlyError(raw: string | undefined | null): string {
  if (!raw) return "";
  const s = String(raw);

  try {
    for (const rule of STELLAR_RULES) {
      if (rule.test.test(s)) return t(rule.key);
    }

    // 429 is a more specific case of "4xx" — check it first.
    if (/^Request failed \(HTTP 429\)/i.test(s) || /^429\s+Too Many Requests$/i.test(s)) {
      return t("tooManyRequests");
    }

    const wrappedMatch = /^Request failed \(HTTP (\d\d\d)\)/i.exec(s);
    const bareMatch = BARE_HTTP_STATUS.exec(s);
    const statusCode = wrappedMatch ? Number(wrappedMatch[1]) : bareMatch ? Number(bareMatch[1]) : null;

    if (statusCode !== null) {
      if (statusCode >= 500) {
        const base = t("serverError");
        // The synthesized postJSON fallback text already tells the user to
        // check their history — don't repeat the same reminder twice.
        return CHECK_HISTORY_RE.test(s) ? base : `${base} ${t("checkHistorySuffix")}`;
      }
      if (statusCode >= 400) {
        return t("requestRejected");
      }
    }

    if (/network error|failed to fetch/i.test(s)) {
      return t("offline");
    }
  } catch {
    return s; // a translation lookup failure must never hide the raw message
  }

  return s;
}
