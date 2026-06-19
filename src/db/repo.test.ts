import { describe, it, expect } from "vitest";
import { listLogs } from "./repo";

/**
 * listLogs input handling. With no SQL Server configured in the test env,
 * dbReady() is false, so listLogs clamps/validates its inputs and returns an
 * empty page WITHOUT touching the DB. The clamp and level-validation run BEFORE
 * the dbReady guard, so the echoed limit/offset still prove they were applied.
 */
describe("repo.listLogs (no DB)", () => {
  it("clamps an over-large limit to 500", async () => {
    const page = await listLogs({ limit: 100_000, offset: 0 });
    expect(page.limit).toBe(500);
    expect(page).toEqual({ rows: [], total: 0, limit: 500, offset: 0 });
  });

  it("clamps a zero/sub-1 limit up to 1", async () => {
    const page = await listLogs({ limit: 0, offset: 0 });
    expect(page.limit).toBe(1);
  });

  it("clamps a negative offset up to 0", async () => {
    const page = await listLogs({ limit: 50, offset: -25 });
    expect(page.offset).toBe(0);
  });

  it("returns an empty page when the DB is not ready", async () => {
    const page = await listLogs({ limit: 50, offset: 10 });
    expect(page).toEqual({ rows: [], total: 0, limit: 50, offset: 10 });
  });

  it("accepts a valid level without throwing", async () => {
    // A valid level survives validation; the empty page (no DB) still comes back.
    const page = await listLogs({ limit: 50, offset: 0, level: "error" });
    expect(page).toEqual({ rows: [], total: 0, limit: 50, offset: 0 });
  });

  it("drops an invalid level (does not throw, returns empty page)", async () => {
    // An unrecognized level is treated as undefined rather than rejected; the
    // important property is that it never throws and never reaches the DB layer.
    const page = await listLogs({ limit: 50, offset: 0, level: "bogus" });
    expect(page).toEqual({ rows: [], total: 0, limit: 50, offset: 0 });
  });
});
