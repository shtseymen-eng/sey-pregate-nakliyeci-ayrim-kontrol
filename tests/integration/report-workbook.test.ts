import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildReportModel } from "@/analysis/build-report";
import { buildReportFileName } from "@/excel/build-file-name";
import { buildReportWorkbook } from "@/excel/write-report";
import type { NormalizedRecord } from "@/types/import";

function record(
  carrier: string,
  day: number,
  hour: number,
  status: string,
  product: string,
  rejectionReason = "",
): NormalizedRecord {
  return {
    sourceRow: day * 100 + hour,
    occurredAt: new Date(2026, 4, day, hour),
    hour,
    department: "Poliport Terminal",
    carrier,
    product,
    status,
    rejectionReason,
  };
}

describe("Excel report output", () => {
  it("writes a styled 23-sheet workbook from the shared report model", async () => {
    const model = buildReportModel({
      records: [
        record("Firma A", 1, 8, "Onaylandı", "Ürün X"),
        record("Firma A", 1, 9, "Red", "Ürün X", "SRC5 yoktur"),
        record("Firma B", 2, 10, "Red", "Ürün Y", "Çekici ADR evrakı eksik"),
      ],
      statusRules: {},
      importSummary: {
        rowsRead: 3,
        rowsIncluded: 3,
        rowsExcludedDepartment: 0,
        invalidRows: 0,
        warnings: [],
      },
    });
    const template = await fs.readFile(
      path.join(process.cwd(), "public/templates/terminal-ilk20-template.xlsx"),
    );
    const bytes = await buildReportWorkbook(
      model,
      template.buffer.slice(template.byteOffset, template.byteOffset + template.byteLength),
    );
    const zip = await JSZip.loadAsync(bytes);
    const chartNames = Object.keys(zip.files)
      .filter((name) => /^xl\/charts\/chart\d+\.xml$/.test(name))
      .sort();
    const drawingNames = Object.keys(zip.files)
      .filter((name) => /^xl\/drawings\/drawing\d+\.xml$/.test(name))
      .sort();
    expect(chartNames).toHaveLength(3);
    expect(drawingNames).toHaveLength(3);
    const overallChart = await zip.file("xl/charts/chart1.xml")!.async("text");
    expect(overallChart).toContain("Saatlik Kayıt Yoğunluğu");
    expect(overallChart).toContain("'Saat Yoğunluk'!$A$6:$A$29");
    expect(overallChart).toContain("'Saat Yoğunluk'!$B$6:$B$29");
    expect(overallChart).toContain('<c:barDir val="col"/>');
    expect(overallChart).toContain('<c:showVal val="1"/>');
    const firstDetailChart = await zip.file("xl/charts/chart2.xml")!.async("text");
    expect(firstDetailChart).toContain("'1. Firma A'!$F$11:$F$34");
    expect(firstDetailChart).toContain("'1. Firma A'!$G$11:$G$34");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    expect(workbook.worksheets).toHaveLength(23);
    expect(workbook.worksheets.slice(0, 3).map((sheet) => sheet.name)).toEqual([
      "Yönetim Özeti",
      "Kök Sebep Analizi",
      "Saat Yoğunluk",
    ]);
    const summary = workbook.getWorksheet("Yönetim Özeti")!;
    expect(summary.getCell("A2").value).toContain("01.05.2026–02.05.2026");
    expect(summary.getCell("A5").value).toBe(2);
    expect(summary.getCell("A5").numFmt).toBe("#,##0");
    expect(summary.getCell("D5").value).toBe(3);
    expect(summary.getCell("D5").numFmt).toBe("#,##0");
    expect(summary.getCell("G5").value).toBe(2);
    expect(summary.getCell("G5").numFmt).toBe("#,##0");
    expect(summary.getCell("J5").value).toBeCloseTo(2 / 3);
    expect(summary.getCell("J5").numFmt).toBe("0.0%");
    expect(summary.getCell("A10").fill).toMatchObject({ type: "pattern" });
    const conditionalFormattings = (summary as unknown as {
      conditionalFormattings: Array<{
        ref: string;
        rules: Array<{
          type: string;
          cfvo?: Array<{ type: string; value?: number }>;
          color?: { argb?: string };
          gradient?: boolean;
          showValue?: boolean;
        }>;
      }>;
    }).conditionalFormattings;
    expect(
      conditionalFormattings.some(
        (formatting) => formatting.ref === "J5" && formatting.rules.some((rule) => rule.type === "dataBar"),
      ),
    ).toBe(true);
    const summaryRateRule = conditionalFormattings
      .find((formatting) => formatting.ref === "J5")
      ?.rules.find((rule) => rule.type === "dataBar");
    expect(summaryRateRule?.cfvo).toEqual([
      { type: "num", value: 0 },
      { type: "num", value: 1 },
    ]);
    expect(summaryRateRule?.color).toMatchObject({ argb: "FFEF4444" });
    expect(summaryRateRule?.gradient).not.toBe(false);
    expect(summaryRateRule?.showValue).not.toBe(false);
    expect(summary.getCell("J5").fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    });
    expect(
      conditionalFormattings.some(
        (formatting) => formatting.ref === "D11:D30" && formatting.rules.some((rule) => rule.type === "dataBar"),
      ),
    ).toBe(true);
    expect(summary.getCell("D11").fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    });

    const roots = workbook.getWorksheet("Kök Sebep Analizi")!;
    expect(roots.getCell("A6").value).toBe("Çekici ADR/T9 evrakı eksik");
    expect(roots.getCell("A6").fill).toMatchObject({ type: "pattern", pattern: "none" });
    expect(roots.getCell("D6").fill).toMatchObject({ type: "pattern", pattern: "none" });
    expect(roots.getCell("E6").fill).toMatchObject({ type: "pattern", pattern: "none" });

    const firstDetail = workbook.worksheets[3];
    expect(firstDetail.getCell("A1").value).toContain("Firma A");
    expect(firstDetail.getCell("A11").value).toBe("Ürün X");
    expect(firstDetail.getCell("B11").numFmt).toBe("#,##0");
    expect(firstDetail.getCell("F11").value).toBe("00:00");
    expect(firstDetail.getCell("G11").numFmt).toBe("#,##0");
    expect(firstDetail.getCell("A11").fill).toMatchObject({ type: "pattern", pattern: "none" });
    expect(firstDetail.getCell("F11").fill).toMatchObject({ type: "pattern", pattern: "none" });
    const lastDetail = workbook.worksheets[22];
    expect(lastDetail.getCell("A11").value).toBe("Bu dönem için veri yok");
  });

  it("builds the requested period-based filename", () => {
    expect(
      buildReportFileName({
        start: new Date(2026, 0, 1),
        end: new Date(2026, 2, 31),
      }),
    ).toBe("Terminal_Ilk20_01.01.2026_31.03.2026.xlsx");
  });

  it("keeps root causes near the chart when a carrier has a long product list", async () => {
    const records = Array.from({ length: 101 }, (_, index) =>
      record(
        "Uzun Ürünlü Firma",
        (index % 20) + 1,
        index % 24,
        index === 0 ? "Red" : "Onaylandı",
        `Ürün ${String(index + 1).padStart(3, "0")}`,
        index === 0 ? "SRC5 yoktur" : "",
      ),
    );
    const model = buildReportModel({
      records,
      statusRules: {},
      importSummary: {
        rowsRead: records.length,
        rowsIncluded: records.length,
        rowsExcludedDepartment: 0,
        invalidRows: 0,
        warnings: [],
      },
    });
    const template = await fs.readFile(
      path.join(process.cwd(), "public/templates/terminal-ilk20-template.xlsx"),
    );
    const bytes = await buildReportWorkbook(
      model,
      template.buffer.slice(template.byteOffset, template.byteOffset + template.byteLength),
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const detail = workbook.worksheets[3];
    expect(detail.getCell("A111").value).toBeTruthy();
    expect(detail.getCell("I32").value).toBe("Kök Sebepler");
    expect(detail.getCell("I34").value).toBe("Sürücü SRC5 belgesi eksik");
    expect(detail.getCell("J34").value).toBe(1);
    expect(detail.getCell("A115").value).toBeNull();
  });
});
