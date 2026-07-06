/**
 * Admin backoffice credential setup (Feature 4). Two modes:
 *
 *   npm run admin:totp-setup            -> fresh TOTP secret + otpauth:// URI
 *   npm run admin:hash-password -- <pw> -> bcrypt hash for ADMIN_PASSWORD_HASH
 *
 * Nothing here touches the database or the network; copy the printed values
 * into your production env (ADMIN_EMAIL / ADMIN_PASSWORD_HASH /
 * ADMIN_TOTP_SECRET) and restart. All three must be set for /admin to accept
 * logins.
 */
import { generateTotpSecret, otpauthUri, totpCode } from "../src/admin/totp";
import { hashPassword } from "../src/users/password";

async function main(): Promise<void> {
  const mode = process.argv[2];

  if (mode === "totp") {
    const secret = generateTotpSecret();
    const account = process.argv[3] || "admin";
    console.log("\n  Atrium admin TOTP enrollment");
    console.log("  ----------------------------");
    console.log(`  ADMIN_TOTP_SECRET=${secret}`);
    console.log(`\n  Add to your authenticator app (manual entry or QR from this URI):`);
    console.log(`  ${otpauthUri(secret, account)}`);
    console.log(`\n  Current code (sanity check against your app): ${totpCode(secret)}`);
    console.log("\n  Store the secret ONLY in the server env. It is shown once.\n");
    return;
  }

  if (mode === "hash") {
    const pw = process.argv[3];
    if (!pw || pw.length < 12) {
      console.error("Usage: npm run admin:hash-password -- <password (min 12 chars)>");
      process.exitCode = 1;
      return;
    }
    console.log(`\n  ADMIN_PASSWORD_HASH=${await hashPassword(pw)}\n`);
    return;
  }

  console.error("Usage: tsx scripts/admin-setup.ts totp [account] | hash <password>");
  process.exitCode = 1;
}

void main();
