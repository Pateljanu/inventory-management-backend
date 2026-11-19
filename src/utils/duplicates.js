const DAY_MS = 86_400_000;

/** Date filter for business dates within `days` calendar days either side of `date`. */
export function duplicateWindow(date, days) {
  const at = new Date(date).getTime();
  return { $gte: new Date(at - days * DAY_MS), $lte: new Date(at + days * DAY_MS) };
}
