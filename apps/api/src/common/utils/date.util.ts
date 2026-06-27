/** Add a whole number of days to a date, returning a new Date. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add a whole number of years to a date, returning a new Date.
 * Handles Feb 29 by clamping to Feb 28 on non-leap target years.
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const targetYear = result.getFullYear() + years;
  const month = result.getMonth();
  const day = result.getDate();

  result.setFullYear(targetYear, month, day);

  // If the day overflowed (e.g. Feb 29 -> Mar 1), clamp back to the last day of the intended month.
  if (result.getMonth() !== month) {
    result.setDate(0);
  }

  return result;
}
