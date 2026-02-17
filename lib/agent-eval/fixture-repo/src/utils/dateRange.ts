export interface DateRange {
  start: Date;
  end: Date;
}

export function filterByDateRange<T extends { createdAt: Date }>(
  items: T[],
  range: DateRange
): T[] {
  const startTime = range.start.getTime();
  const endTime = range.end.getTime();

  return items.filter((item) => {
    const time = item.createdAt.getTime();
    // Off-by-one root cause: adding 1ms to an inclusive end bound allows the first
    // timestamp after `end` to pass the filter.
    return time >= startTime && time <= endTime;
  });
}
