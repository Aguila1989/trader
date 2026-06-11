import { config } from "./config";

/**
 * Trading-day boundary helpers.
 *
 * The "trading day" - the window the daily caps (MAX_DAILY_LOSS / volume /
 * trade count) and the dayKey pivot on - resets at LOCAL MIDNIGHT in
 * config.timezone (an IANA zone like "America/New_York"; default "UTC").
 *
 * Both the in-memory store (store.ts) and the SQL Server boot hydration
 * (repo.ts) MUST agree on this boundary, otherwise today's restored counters
 * wouldn't line up with the live ones - hence this single shared module.
 */

/** YYYY-MM-DD for the given instant, rendered in the configured zone. */
export function dayKey(d: Date = new Date()): string {
  // "en-CA" formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * The UTC instant of the most recent local-midnight in the configured zone
 * (i.e. the start of dayKey(d)). Used as the lower bound when summing/replaying
 * "today's" fills against UTC ISO timestamps.
 */
export function dayStartUtc(d: Date = new Date()): Date {
  const ymd = dayKey(d);
  // Midnight UTC of that calendar day, then shift by the zone's offset so the
  // result is the UTC instant of local midnight. The offset is sampled at the
  // UTC-midnight guess; it can differ from the true boundary only across a DST
  // transition within the same day (a <=1h edge that doesn't matter for a
  // daily reset).
  const guess = new Date(`${ymd}T00:00:00.000Z`);
  const offsetMin = tzOffsetMinutes(guess, config.timezone);
  return new Date(guess.getTime() - offsetMin * 60_000);
}

/** Offset of `tz` at instant `d`, in minutes east of UTC (e.g. -240 for EDT). */
function tzOffsetMinutes(d: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const get = (k: string): number => Number(map[k] ?? "0");
  const hour = get("hour") === 24 ? 0 : get("hour");

  const asUtc = Date.UTC(
    Number(map["year"] ?? "1970"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - d.getTime()) / 60_000);
}
