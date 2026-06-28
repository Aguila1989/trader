/**
 * Password strength policy - the single source of truth for the registration /
 * reset rules. The backend treats this as AUTHORITATIVE (it re-validates every
 * password server-side); the frontend mirrors the same rules in
 * web/src/auth/passwordPolicy.ts purely to drive the live strength indicator.
 *
 * Spec (Feature 2):
 *   - minimum 12 characters
 *   - at least one uppercase, one lowercase, one number, one special character
 */

/** Minimum length required by the spec. */
export const PASSWORD_MIN_LENGTH = 12;

/** A single rule the password must satisfy, with a human-readable label. */
export interface PasswordRule {
  id: "length" | "upper" | "lower" | "number" | "special";
  label: string;
  test: (pw: string) => boolean;
}

/** Anything that is not a letter or digit counts as a "special" character. */
const SPECIAL_RE = /[^A-Za-z0-9]/;

export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", label: "An uppercase letter (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", label: "A lowercase letter (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "A number (0-9)", test: (pw) => /[0-9]/.test(pw) },
  { id: "special", label: "A special character (!@#$…)", test: (pw) => SPECIAL_RE.test(pw) },
];

export interface PasswordCheck {
  /** True only when every rule passes. */
  valid: boolean;
  /** Ids of the rules that FAILED (empty when valid). */
  failed: PasswordRule["id"][];
  /** 0-4 strength score (number of satisfied rules beyond the base length one). */
  score: number;
}

/**
 * Validate a candidate password against every rule. Returns the failed rule ids
 * (used to build a server-side error message) and a 0-4 strength score.
 */
export function checkPassword(pw: string): PasswordCheck {
  if (typeof pw !== "string") return { valid: false, failed: PASSWORD_RULES.map((r) => r.id), score: 0 };
  const failed = PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.id);
  // Score: how many of the FIVE rules pass, capped to 0-4 for a 4-segment meter.
  const passed = PASSWORD_RULES.length - failed.length;
  const score = Math.min(4, Math.max(0, passed - 1));
  return { valid: failed.length === 0, failed, score };
}

/**
 * Server-side guard: returns an error STRING when the password is too weak, or
 * null when it satisfies the policy. The message lists the unmet requirements
 * without echoing the password itself.
 */
export function validatePasswordOrError(pw: string): string | null {
  const { valid, failed } = checkPassword(pw);
  if (valid) return null;
  const labels = PASSWORD_RULES.filter((r) => failed.includes(r.id)).map((r) => r.label.toLowerCase());
  return `Password does not meet the requirements: ${labels.join(", ")}.`;
}
