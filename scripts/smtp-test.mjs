/**
 * Throwaway SMTP validator — confirms your SMTP_* env can actually authenticate
 * and send, WITHOUT booting the mainnet server. Build the transport exactly the
 * way src/auth/mailer.ts does, so a pass here means the real app will send too.
 *
 *   node scripts/smtp-test.mjs you@personal-email.example
 *
 * Delete this file whenever — it's just a credential check.
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/smtp-test.mjs <recipient-email>");
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD;
const from = process.env.SMTP_FROM || user;

if (!host) {
  console.error("SMTP_HOST is empty — nothing to test. Fill it in .env first.");
  process.exit(1);
}
if (!from) {
  console.error("SMTP_FROM (and SMTP_USER) are empty — set at least one.");
  process.exit(1);
}

console.log(`Connecting to ${host}:${port} (secure=${secure}) as ${user || "(no auth)"} ...`);

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user ? { user, pass } : undefined,
});

try {
  await transport.verify();
  console.log("OK  handshake + auth succeeded.");
  const info = await transport.sendMail({
    from,
    to,
    subject: "Atrium SMTP test",
    text: "If you can read this, your Atrium SMTP config works.",
    html: "<p>If you can read this, your <b>Atrium</b> SMTP config works.</p>",
  });
  console.log(`OK  sent. messageId=${info.messageId}`);
  console.log(`    server response: ${info.response}`);
  console.log(`\nCheck the inbox for ${to} (and its spam folder).`);
} catch (err) {
  console.error(`\nFAILED: ${err && err.message ? err.message : err}`);
  console.error("Common causes: wrong SMTP key, unverified sender (SMTP_FROM),");
  console.error("or SMTP_SECURE/port mismatch (use false+587 for STARTTLS).");
  process.exit(1);
}
