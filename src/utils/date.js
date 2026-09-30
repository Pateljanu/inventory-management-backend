const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Business dates (purchaseDate, poDate, saleDate, report from/to) are calendar days, not instants.
 * They are always stored as UTC midnight so a date never shifts across a timezone boundary and
 * same-day comparisons are exact.
 */
export function parseBusinessDate(value) {
  if (value instanceof Date) return startOfDayUTC(value);
  const match = DATE_ONLY.exec(String(value));
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects impossible dates such as 2026-02-30 that Date.UTC would silently roll over.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export function startOfDayUTC(value) {
  const d = new Date(value);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfDayUTC(value) {
  const d = new Date(value);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Today's calendar date in the business time zone, as a UTC-midnight business date.
 * (At 01:00 IST the UTC date is still yesterday; using it would hide today's transactions.)
 */
export function businessToday(timeZone, now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return parseBusinessDate(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  );
}

export function toDateOnlyString(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

/** Inclusive calendar-day range filter on `field`. */
export function dateFilter(from, to, field) {
  if (!from && !to) return {};
  const range = {};
  if (from) range.$gte = startOfDayUTC(from);
  if (to) range.$lte = endOfDayUTC(to);
  return { [field]: range };
}

const DAY_MS = 86_400_000;

/** Picks a readable bucket size for a trend: days up to 2 weeks, weeks up to ~3 months, then months. */
export function autoBucket(from, to) {
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  if (days <= 14) return 'day';
  if (days <= 92) return 'week';
  return 'month';
}

/**
 * Consecutive calendar buckets covering [from, to] (UTC-midnight business dates). Weeks run Monday
 * to Sunday and months are calendar months; the first and last buckets are clipped to the range,
 * so "This month" starts with "01–06 Sep" when the 1st is a Tuesday.
 */
export function bucketRanges(from, to, bucket) {
  const out = [];
  let start = startOfDayUTC(from);
  const last = startOfDayUTC(to);
  while (start <= last) {
    let end;
    if (bucket === 'day') {
      end = start;
    } else if (bucket === 'week') {
      const toSunday = (7 - start.getUTCDay()) % 7; // getUTCDay: 0 = Sunday
      end = new Date(start.getTime() + toSunday * DAY_MS);
    } else {
      end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    }
    if (end > last) end = last;
    out.push({ start, end });
    start = new Date(end.getTime() + DAY_MS);
  }
  return out;
}
