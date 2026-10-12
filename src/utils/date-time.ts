const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const DAY_MS = 24 * 60 * 60 * 1000;

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date | null {
  const result = new Date(year, month - 1, day, hour, minute, second, 0);
  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day ||
    result.getHours() !== hour ||
    result.getMinutes() !== minute
  ) {
    return null;
  }
  return result;
}

export function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
    );
  }

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const utc = new Date(EXCEL_EPOCH_UTC + value * DAY_MS);
    return new Date(
      utc.getUTCFullYear(),
      utc.getUTCMonth(),
      utc.getUTCDate(),
      utc.getUTCHours(),
      utc.getUTCMinutes(),
      utc.getUTCSeconds(),
    );
  }

  if (typeof value !== "string") return null;
  const text = value.trim();
  const turkish = text.match(
    /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (turkish) {
    return localDate(
      Number(turkish[3]),
      Number(turkish[2]),
      Number(turkish[1]),
      Number(turkish[4] ?? 0),
      Number(turkish[5] ?? 0),
      Number(turkish[6] ?? 0),
    );
  }

  const iso = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (iso) {
    return localDate(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      Number(iso[4] ?? 0),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0),
    );
  }
  return null;
}

export function parseHourValue(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getHours();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value < 1) return Math.floor(value * 24);
    if (Number.isInteger(value) && value >= 0 && value <= 23) return value;
    return null;
  }
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? hour : null;
}

export function combineDateTime(
  dateValue: unknown,
  timeValue?: unknown,
): Date | null {
  const date = parseDateValue(dateValue);
  if (!date) return null;
  if (timeValue === undefined || timeValue === null || timeValue === "") return date;
  const hour = parseHourValue(timeValue);
  if (hour === null) return null;
  date.setHours(hour, 0, 0, 0);
  return date;
}
