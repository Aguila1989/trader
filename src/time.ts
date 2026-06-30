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

/**
 * The next UTC instant at which the LOCAL clock in config.timezone reads weekday
 * `dayOfWeek` (0=Sun … 6=Sat) at `minuteOfDay` minutes after midnight, strictly
 * AFTER `from`. Used by the Feature 4 weekly trustline-scan scheduler so the
 * scan always fires at a fixed local weekday + time. DST-aware: the local
 * time-of-day is held across transitions (the same <=1h edge tolerance as
 * dayStartUtc). Falls back to "one week out" only if no slot is found in 8 days.
 */
export function nextWeeklyOccurrenceUtc(
  dayOfWeek: number,
  minuteOfDay: number,
  from: Date = new Date(),
): Date {
  const dow = (((Math.round(dayOfWeek) % 7) + 7) % 7);
  const mod = Math.min(1439, Math.max(0, Math.round(minuteOfDay)));
  const hour = Math.floor(mod / 60);
  const minute = mod % 60;
  for (let addDays = 0; addDays <= 8; addDays++) {
    const probe = new Date(from.getTime() + addDays * 86_400_000);
    const ymd = dayKey(probe); // local calendar day (YYYY-MM-DD) in config.timezone
    // Weekday of a calendar date is zone-independent; read it off UTC midnight.
    const wd = new Date(`${ymd}T00:00:00.000Z`).getUTCDay();
    if (wd !== dow) continue;
    const utc = localWallClockToUtc(ymd, hour, minute);
    if (utc.getTime() > from.getTime()) return utc;
  }
  return new Date(from.getTime() + 7 * 86_400_000);
}

/** UTC instant when local time in config.timezone is `ymd` at hour:minute. */
function localWallClockToUtc(ymd: string, hour: number, minute: number): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  const guess = new Date(`${ymd}T${hh}:${mm}:00.000Z`);
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
