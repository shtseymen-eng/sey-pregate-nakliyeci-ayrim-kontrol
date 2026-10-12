import { describe, expect, it } from "vitest";
import { makeUniqueSheetName } from "@/excel/sheet-names";

describe("makeUniqueSheetName", () => {
  it("creates legal, unique and deterministic Excel sheet names", () => {
    const used = new Set<string>();
    const first = makeUniqueSheetName(
      1,
      "Çok Uzun / Nakliyeci : Adı * Aynı Başlangıç 123456789",
      used,
    );
    const second = makeUniqueSheetName(
      2,
      "Çok Uzun / Nakliyeci : Adı * Aynı Başlangıç 123456789",
      used,
    );

    expect(first.length).toBeLessThanOrEqual(31);
    expect(second.length).toBeLessThanOrEqual(31);
    expect(first).not.toMatch(/[\\/*?:[\]]/);
    expect(second).not.toBe(first);
    expect(first.startsWith("1. ")).toBe(true);
    expect(second.startsWith("2. ")).toBe(true);
  });
});
