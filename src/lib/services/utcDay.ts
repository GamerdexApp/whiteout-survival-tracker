const MS_PER_DAY = 86_400_000;

export const utcDayOf = (at: Date) => at.toISOString().slice(0, 10);

/** The UTC day before a UTC day (YYYY-MM-DD). */
export const utcDayBefore = (day: string) =>
  utcDayOf(new Date(Date.parse(day) - MS_PER_DAY));

/** The milliseconds until the next UTC midnight, when a daily claim becomes free again. */
export const msUntilNextUtcDay = (now: number) =>
  MS_PER_DAY - (now % MS_PER_DAY);
