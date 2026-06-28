/**
 * Transactional email for verification + password-reset links.
 *
 * nodemailer is an OPTIONAL dependency, loaded lazily: if SMTP is not configured
 * (SMTP_HOST empty) OR the package isn't installed, email is simply skipped and
 * a warning is logged - the caller (src/auth/service.ts) then degrades exactly
 * as the spec requires (registration auto-verifies when there is no SMTP). We
 * never throw into the request path: a mail failure must not 500 a registration
 * or reveal, via an error, whether an account exists.
 */
import { config, smtpConfigured, publicBaseUrl } from "../config";
import { store } from "../trading/store";

export { smtpConfigured };

/** Build an absolute SPA link (hash route) for an emailed token. */
export function buildLink(route: "verify-email" | "reset-password", token: string): string {
  return `${publicBaseUrl}/#/${route}?token=${encodeURIComponent(token)}`;
}

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Cache the transport across calls. `unknown` because nodemailer's types aren't
// guaranteed present (optional dep); we duck-type sendMail.
let transport: { sendMail: (m: Record<string, unknown>) => Promise<unknown> } | null = null;
let transportInit = false;

async function getTransport(): Promise<{ sendMail: (m: Record<string, unknown>) => Promise<unknown> } | null> {
  if (transportInit) return transport;
  transportInit = true;
  if (!smtpConfigured) return null;
  try {
    // Lazy + dynamic so a missing nodemailer never breaks app boot/typecheck.
    // A NON-LITERAL specifier keeps TypeScript from resolving an optional dep
    // that may not be installed; Node resolves it at runtime (reject => null).
    const moduleName = "nodemailer";
    const mod: any = await import(moduleName).catch(() => null);
    const nodemailer = mod?.default ?? mod;
    if (!nodemailer?.createTransport) {
      store.log("warn", "SMTP_HOST is set but the 'nodemailer' package is not installed - email is disabled. Run `npm i nodemailer`.");
      return null;
    }
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    });
    return transport;
  } catch (err) {
    store.log("error", `Failed to initialise SMTP transport: ${(err as Error).message}. Email is disabled.`);
    return null;
  }
}

/**
 * Best-effort send. Returns true if handed to the SMTP server, false if email is
 * disabled or the send failed (the caller logs/degrades; it never throws).
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = await getTransport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: config.smtp.from || config.smtp.user || "no-reply@atrium.local",
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (err) {
    // Log server-side only; the caller returns a generic response regardless.
    store.log("error", `Failed to send email to ${mail.to}: ${(err as Error).message}`);
    return false;
  }
}
