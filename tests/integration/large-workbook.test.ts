import { describe, expect, it } from "vitest";
import { buildReportModel } from "@/analysis/build-report";
import { normalizeRecords } from "@/analysis/normalize-records";

describe("large report input", () => {
  it("processes 50,000 mixed-department rows with reconciled totals", () => {
    const rows = Array.from({ length: 50_000 }, (_, index) => [
      new Date(2026, index % 6, (index % 28) + 1, index % 24),
      index % 3 === 0 ? "Poliport Terminal" : index % 3 === 1 ? "Depo Operasyon" : "Liman Operasyon",
      `Nakliyeci ${String(index % 35).padStart(2, "0")}`,
      `Ürün ${index % 8}`,
      index % 7 === 0 ? "Red" : "Onaylandı",
      index % 7 === 0 ? "SRC5 belgesi yoktur" : "",
    ]);
    const startedAt = performance.now();
    const normalized = normalizeRecords(rows, {
      date: 0,
      department: 1,
      carrier: 2,
      product: 3,
      status: 4,
      rejectionReason: 5,
    });
    const report = buildReportModel({
      records: normalized.records,
      statusRules: {},
      importSummary: {
        rowsRead: rows.length,
        rowsIncluded: normalized.records.length,
        rowsExcludedDepartment: normalized.departmentSummary.rowsExcludedDepartment,
        invalidRows: normalized.invalidRows.length,
        warnings: normalized.warnings,
      },
    });

    expect(normalized.records).toHaveLength(16_667);
    expect(report.totals.registrations).toBe(normalized.records.length);
    expect(report.allCarriers.reduce((sum, carrier) => sum + carrier.registrations, 0)).toBe(report.totals.registrations);
    expect(report.topCarriers).toHaveLength(20);
    expect(performance.now() - startedAt).toBeLessThan(5_000);
  });
});
