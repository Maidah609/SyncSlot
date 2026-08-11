/** Availability engine: given weekly rules + overrides + existing bookings, return bookable slot start times for a given date in the host's timezone. */

export type WeeklyRule = { day: "SUN"|"MON"|"TUE"|"WED"|"THU"|"FRI"|"SAT"; start_minute: number; end_minute: number };
export type Override = { date: string; is_blocked: boolean; start_minute: number | null; end_minute: number | null };
export type Busy = { start: Date; end: Date };

const DAY_KEYS: WeeklyRule["day"][] = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

/** Convert a "wall-clock" date+minute in a given IANA timezone to a real UTC Date */
export function zonedWallToUTC(dateYMD: string, minute: number, timeZone: string): Date {
  const [y, m, d] = dateYMD.split("-").map(Number);
  const hh = Math.floor(minute / 60);
  const mm = minute % 60;
  // Build a UTC guess, then correct by comparing formatted TZ output
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(guess);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour === "24" ? "0" : map.hour), Number(map.minute));
  const offset = asUTC - guess.getTime();
  return new Date(guess.getTime() - offset);
}

/** Return YYYY-MM-DD and weekday-key in given timezone for a Date */
export function ymdInZone(date: Date, timeZone: string): { ymd: string; day: WeeklyRule["day"] } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  const wd = m.weekday.toUpperCase().slice(0, 3);
  const dayKey = (["SUN","MON","TUE","WED","THU","FRI","SAT"].includes(wd) ? wd : "SUN") as WeeklyRule["day"];
  return { ymd: `${m.year}-${m.month}-${m.day}`, day: dayKey };
}

export function computeSlots(opts: {
  dateYMD: string;
  hostTimezone: string;
  weeklyRules: WeeklyRule[];
  overrides: Override[];
  busy: Busy[];
  durationMin: number;
  bufferBefore: number;
  bufferAfter: number;
  minNoticeMin: number;
  slotStepMin?: number;
}): Date[] {
  const step = opts.slotStepMin ?? 15;
  const dateObj = zonedWallToUTC(opts.dateYMD, 0, opts.hostTimezone);
  const { day } = ymdInZone(dateObj, opts.hostTimezone);

  // Determine base windows for the day (in host-local minutes)
  const override = opts.overrides.find(o => o.date === opts.dateYMD);
  let windows: Array<[number, number]> = [];
  if (override) {
    if (override.is_blocked) return [];
    if (override.start_minute != null && override.end_minute != null) windows = [[override.start_minute, override.end_minute]];
    else windows = opts.weeklyRules.filter(r => r.day === day).map(r => [r.start_minute, r.end_minute] as [number, number]);
  } else {
    windows = opts.weeklyRules.filter(r => r.day === day).map(r => [r.start_minute, r.end_minute] as [number, number]);
  }

  const now = new Date();
  const minStart = new Date(now.getTime() + opts.minNoticeMin * 60_000);
  const slots: Date[] = [];

  for (const [ws, we] of windows) {
    for (let t = ws; t + opts.durationMin <= we; t += step) {
      const startUTC = zonedWallToUTC(opts.dateYMD, t, opts.hostTimezone);
      const endUTC = new Date(startUTC.getTime() + opts.durationMin * 60_000);
      if (startUTC < minStart) continue;
      // buffer window
      const bStart = new Date(startUTC.getTime() - opts.bufferBefore * 60_000);
      const bEnd = new Date(endUTC.getTime() + opts.bufferAfter * 60_000);
      const clash = opts.busy.some(b => bStart < b.end && bEnd > b.start);
      if (!clash) slots.push(startUTC);
    }
  }
  return slots;
}
