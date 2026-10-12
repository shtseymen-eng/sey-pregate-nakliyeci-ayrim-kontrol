function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatReportDate(date: Date): string {
  return `${twoDigits(date.getDate())}.${twoDigits(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function buildReportFileName(period: { start: Date; end: Date }): string {
  return `Terminal_Ilk20_${formatReportDate(period.start)}_${formatReportDate(period.end)}.xlsx`;
}
