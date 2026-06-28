// Client-side mirror of the server password policy (src/auth/passwordPolicy.ts).
// Drives the live strength indicator + per-rule checklist on the register/reset
// screens. The SERVER is always authoritative; this is UX only.

export const PASSWORD_MIN_LENGTH = 12;

export type RuleId = "length" | "upper" | "lower" | "number" | "special";

const SPECIAL_RE = /[^A-Za-z0-9]/;

export const PASSWORD_RULES: ReadonlyArray<{ id: RuleId; test: (pw: string) => boolean }> = [
  { id: "length", test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", test: (pw) => SPECIAL_RE.test(pw) },
];

export interface PasswordCheck {
  valid: boolean;
  results: { id: RuleId; ok: boolean }[];
  /** 0-4 for a four-segment strength meter. */
  score: number;
  /** "weak" | "fair" | "good" | "strong" - keyed for i18n + colour. */
  strength: "empty" | "weak" | "fair" | "good" | "strong";
}

export function checkPassword(pw: string): PasswordCheck {
  const results = PASSWORD_RULES.map((r) => ({ id: r.id, ok: r.test(pw) }));
  const passed = results.filter((r) => r.ok).length;
  const valid = passed === PASSWORD_RULES.length;
  const score = Math.min(4, Math.max(0, passed - 1));
  const strength: PasswordCheck["strength"] =
    pw.length === 0 ? "empty" : score <= 1 ? "weak" : score === 2 ? "fair" : score === 3 ? "good" : "strong";
  return { valid, results, score, strength };
}
