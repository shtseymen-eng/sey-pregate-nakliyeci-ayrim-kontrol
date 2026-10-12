import { describe, expect, it } from "vitest";
import { normalizeRecords } from "@/analysis/normalize-records";
import { readWorkbook } from "@/excel/read-workbook";
import { makeSyntheticWorkbook } from "../fixtures/synthetic-workbook";

describe("workbook import", () => {
  it("finds the populated sheet and header row after preface rows", async () => {
    const bytes = await makeSyntheticWorkbook({
      emptyFirstSheet: true,
      prefaceRows: [["Rapor"], ["01.05.2026 - 31.05.2026"], []],
      rows: [
        ["17.05.2026", "09:15", "Poliport Terminal", "Firma 01", "Ürün A", "Red", "Evrak eksik", "Müşteri A"],
      ],
    });

    const candidate = await readWorkbook(bytes, "arac-kayit.xlsx");
    expect(candidate.sheetName).toBe("Araç Kayıt Sorgu");
    expect(candidate.headerRowNumber).toBe(4);
    expect(candidate.rows).toHaveLength(1);
    expect(candidate.suggestion.requiresUserMapping).toBe(false);
  });

  it("filters department before validating dates and reports row counts", async () => {
    const bytes = await makeSyntheticWorkbook({
      rows: [
        ["17.05.2026", "09:15", "Poliport Terminal", "Firma 01", "Ürün A", "Onaylandı", "", "Müşteri A"],
        ["not-a-date", "10:00", "Başka Departman", "Firma 99", "Ürün X", "Red", "Başka sebep", "Müşteri X"],
        ["18.05.2026", "11:00", "Poliport Tank", "Firma 88", "Ürün Y", "Red", "Başka sebep", "Müşteri Y"],
      ],
    });
    const candidate = await readWorkbook(bytes, "arac-kayit.xlsx");
    const normalized = normalizeRecords(
      candidate.rows,
      candidate.suggestion.mapping as never,
      candidate.headerRowNumber,
    );

    expect(normalized.records).toHaveLength(1);
    expect(normalized.invalidRows).toHaveLength(0);
    expect(normalized.departmentSummary).toEqual({
      rowsRead: 3,
      rowsIncluded: 1,
      rowsExcludedDepartment: 2,
    });
  });

  it("rejects unsupported and corrupt files", async () => {
    await expect(readWorkbook(new ArrayBuffer(8), "legacy.xls")).rejects.toThrow(
      ".xlsx",
    );
    await expect(readWorkbook(new ArrayBuffer(8), "broken.xlsx")).rejects.toThrow(
      "açılamadı",
    );
  });
});
