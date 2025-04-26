export function isWithinLast24Hours(date: Date): boolean {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Date(date) >= twentyFourHoursAgo;
}