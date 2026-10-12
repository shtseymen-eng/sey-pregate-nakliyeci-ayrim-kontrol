import { describe, expect, it } from "vitest";
import { normalizeRecords } from "@/analysis/normalize-records";
import { buildReportModel } from "@/analysis/build-report";
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

  it("keeps other departments out of period, ranking and rejections", async () => {
    const bytes = await makeSyntheticWorkbook({
      rows: [
        ["10.05.2026", "09:00", "Poliport Terminal", "Firma 01", "Ürün A", "Onaylandı", "", "Müşteri A"],
        ["20.05.2026", "10:00", "Poliport Terminal", "Firma 02", "Ürün B", "Red", "SRC5 yoktur", "Müşteri B"],
        ["01.01.2020", "08:00", "Başka Departman", "Dev Firma", "Ürün X", "Red", "SRC5 yoktur", "Müşteri X"],
        ["31.12.2030", "08:00", "Poliport Tank", "Dev Firma", "Ürün X", "Red", "SRC5 yoktur", "Müşteri X"],
      ],
    });
    const candidate = await readWorkbook(bytes, "arac-kayit.xlsx");
    const normalized = normalizeRecords(
      candidate.rows,
      candidate.suggestion.mapping as never,
      candidate.headerRowNumber,
    );
    const model = buildReportModel({
      records: normalized.records,
      statusRules: {},
      importSummary: {
        ...normalized.departmentSummary,
        invalidRows: normalized.invalidRows.length,
        warnings: normalized.warnings,
      },
    });

    expect(model.period.start.getFullYear()).toBe(2026);
    expect(model.period.end.getFullYear()).toBe(2026);
    expect(model.totals).toMatchObject({ registrations: 2, rejections: 1 });
    expect(model.topCarriers.map((item) => item.name)).not.toContain("Dev Firma");
  });
});
