/**
 * Standalone schema migration.
 *
 *   npm run db:migrate
 *
 * Creates the database (discrete-config path) and applies the dbo.Proposals
 * table, its indexes, and any additive column migrations - then exits. This runs
 * the SAME idempotent bootstrap the app performs on boot (see db/pool.ts), just
 * on its own, so you can stand up or upgrade the schema WITHOUT starting the
 * trader. Safe to run repeatedly.
 *
 * Requires SQLSERVER_* (or SQLSERVER_CONNECTION_STRING) in .env. For a
 * least-privilege deployment, pre-create the database with an admin login and
 * point this at it via SQLSERVER_CONNECTION_STRING - it then skips the
 * CREATE DATABASE step (which needs elevated rights) and only applies the table.
 */
import { config, dbConfigured } from "../config";
import { initDb, closeDb } from "./pool";

async function main(): Promise<void> {
  if (!dbConfigured) {
    console.error(
      "No SQL Server configured. Set SQLSERVER_HOST/USER/PASSWORD (or " +
        "SQLSERVER_CONNECTION_STRING) in .env, then re-run `npm run db:migrate`.",
    );
    process.exit(1);
  }

  const target = config.db.connectionString
    ? "(connection string)"
    : `${config.db.server || "localhost"}:${config.db.port}/${config.db.database}`;
  console.log(`Applying schema to SQL Server ${target} ...`);

  try {
    await initDb(); // ensureDatabase (discrete path) + ensureSchema + migrations
    console.log("✓ Schema is up to date (dbo.Proposals + indexes).");
  } catch (err) {
    console.error(`✗ Migration failed: ${(err as Error).message}`);
    await closeDb();
    process.exit(1);
  }

  await closeDb();
  console.log("Done.");
}

void main();
