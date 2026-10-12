import { describe, expect, it } from "vitest";
import { combineDateTime, parseDateValue, parseHourValue } from "@/utils/date-time";

describe("date and time normalization", () => {
  it("parses Excel serial, Date and Turkish date text without timezone drift", () => {
    const excel = parseDateValue(46023); // 2026-01-01 in Excel's 1900 system
    const direct = parseDateValue(new Date(2026, 4, 17, 13, 45));
    const dotted = parseDateValue("17.05.2026 13:45");
    const slashed = parseDateValue("17/05/2026");

    expect([excel?.getFullYear(), excel?.getMonth(), excel?.getDate()]).toEqual([
      2026,
      0,
      1,
    ]);
    expect([direct?.getFullYear(), direct?.getMonth(), direct?.getDate()]).toEqual([
      2026,
      4,
      17,
    ]);
    expect(dotted?.getHours()).toBe(13);
    expect(slashed?.getDate()).toBe(17);
  });

  it("parses separate clock values and rejects invalid hours", () => {
    expect(parseHourValue("09:35")).toBe(9);
    expect(parseHourValue(0.75)).toBe(18);
    expect(parseHourValue("24:01")).toBeNull();
    expect(parseHourValue("not-a-time")).toBeNull();
  });

  it("combines a date with a separate hour when supplied", () => {
    const combined = combineDateTime("17.05.2026", "22:10");
    const embedded = combineDateTime("17.05.2026 13:45");

    expect(combined?.getHours()).toBe(22);
    expect(embedded?.getHours()).toBe(13);
  });

  it("returns null for invalid dates", () => {
    expect(parseDateValue("31.02.2026")).toBeNull();
    expect(combineDateTime("not-a-date", "10:00")).toBeNull();
  });
});
