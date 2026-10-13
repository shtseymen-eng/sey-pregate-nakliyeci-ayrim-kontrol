import { REPORT_COLORS, REPORT_LAYOUT } from "@/config/report-layout";
import { formatReportDate } from "@/excel/build-file-name";
import { makeUniqueSheetName } from "@/excel/sheet-names";
import type { CarrierReport, ReportModel } from "@/types/report";

function periodText(model: ReportModel): string {
  return `${formatReportDate(model.period.start)}–${formatReportDate(model.period.end)}`;
}

function setNumberFormat(cell: import("exceljs").Cell, numFmt: string): void {
  // ExcelJS may deduplicate style objects while loading the template. Replacing
  // the style keeps one cell's format from leaking into visually similar cells.
  cell.style = { ...cell.style, numFmt };
}

function formatCount(cell: import("exceljs").Cell): void {
  setNumberFormat(cell, "#,##0");
}

function clearValues(
  sheet: import("exceljs").Worksheet,
  startRow: number,
  endRow: number,
  startColumn: number,
  endColumn: number,
): void {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      sheet.getCell(row, column).value = null;
    }
  }
}

function styleSectionRow(
  sheet: import("exceljs").Worksheet,
  row: number,
  endColumn: number,
  startColumn = 1,
): void {
  for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.style = {
      ...cell.style,
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: REPORT_COLORS.blue } },
      font: { name: "Arial", size: 10, bold: true, color: { argb: REPORT_COLORS.white } },
      alignment: { vertical: "middle" },
    };
  }
}

function styleHeaderRow(
  sheet: import("exceljs").Worksheet,
  row: number,
  endColumn: number,
  startColumn = 1,
): void {
  for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.style = {
      ...cell.style,
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: REPORT_COLORS.navy } },
      font: { name: "Arial", size: 10, bold: true, color: { argb: REPORT_COLORS.white } },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: { style: "thin", color: { argb: REPORT_COLORS.white } },
        left: { style: "thin", color: { argb: REPORT_COLORS.white } },
        bottom: { style: "thin", color: { argb: REPORT_COLORS.white } },
        right: { style: "thin", color: { argb: REPORT_COLORS.white } },
      },
    };
  }
}

function addRejectionRateDataBar(
  sheet: import("exceljs").Worksheet,
  ref: string,
  priority: number,
): void {
  sheet.removeConditionalFormatting((formatting: { ref: string }) => formatting.ref !== ref);
  sheet.addConditionalFormatting({
    ref,
    rules: [
      {
        type: "dataBar",
        priority,
        gradient: true,
        showValue: true,
        color: { argb: "FFEF4444" },
        cfvo: [
          { type: "num", value: 0 },
          { type: "num", value: 1 },
        ],
      } as import("exceljs").ConditionalFormattingRule & {
        color: { argb: string };
      },
    ],
  });
}

function setWhiteFill(cell: import("exceljs").Cell): void {
  cell.style = {
    ...cell.style,
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: REPORT_COLORS.white },
    },
  };
}

function writeSummary(workbook: import("exceljs").Workbook, model: ReportModel): void {
  const layout = REPORT_LAYOUT.summary;
  const sheet = workbook.getWorksheet(layout.sheet)!;
  sheet.getCell(layout.period).value = `${periodText(model)} • Pregate kaydı, sırada ve beklemede durumları red hesabına dahil değildir. Aynı kayıttaki aynı kök sebep yalnızca bir kez sayılır.`;
  sheet.getCell(layout.carriers).value = model.totals.carriers;
  formatCount(sheet.getCell(layout.carriers));
  sheet.getCell(layout.registrations).value = model.totals.registrations;
  formatCount(sheet.getCell(layout.registrations));
  sheet.getCell(layout.rejections).value = model.totals.rejections;
  formatCount(sheet.getCell(layout.rejections));
  sheet.getCell(layout.rejectionRate).value = model.totals.rejectionRate;
  setNumberFormat(sheet.getCell(layout.rejectionRate), "0.0%");
  clearValues(sheet, layout.rankingStartRow, layout.rankingEndRow, 1, 10);
  for (let index = 0; index < model.topCarriers.length; index += 1) {
    const carrier = model.topCarriers[index];
    const row = layout.rankingStartRow + index;
    sheet.getRow(row).values = [
      carrier.name,
      carrier.registrations,
      carrier.rejections,
      carrier.rejectionRate,
      carrier.activeDays,
      carrier.dailyAverage,
      carrier.topProduct?.name ?? "",
      carrier.topProduct?.count ?? 0,
      `${String(carrier.peakHour.hour).padStart(2, "0")}:00`,
      carrier.peakHour.count,
    ];
    [2, 3, 5, 8, 10].forEach((column) => formatCount(sheet.getCell(row, column)));
    setNumberFormat(sheet.getCell(row, 4), "0.0%");
    setNumberFormat(sheet.getCell(row, 6), "#,##0.0");
  }
  ["J5", "K5", "J6", "K6"].forEach((address) => setWhiteFill(sheet.getCell(address)));
  for (let row = layout.rankingStartRow; row <= layout.rankingEndRow; row += 1) {
    setWhiteFill(sheet.getCell(row, 4));
  }
  addRejectionRateDataBar(sheet, layout.rejectionRate, 1);
  addRejectionRateDataBar(
    sheet,
    `D${layout.rankingStartRow}:D${layout.rankingEndRow}`,
    2,
  );
}

function writeRootCauses(workbook: import("exceljs").Workbook, model: ReportModel): void {
  const layout = REPORT_LAYOUT.roots;
  const sheet = workbook.getWorksheet(layout.sheet)!;
  sheet.getCell(layout.period).value = `${periodText(model)} • Aynı anlama gelen açıklamalar standart başlıklarda birleştirilmiştir.`;
  clearValues(sheet, 6, 200, 1, 6);
  model.rootCauses.slice(0, 195).forEach((cause, index) => {
    const row = layout.generalStartRow + index;
    sheet.getCell(row, 1).value = cause.label;
    sheet.getCell(row, 2).value = cause.count;
    formatCount(sheet.getCell(row, 2));
  });
  let row = layout.carrierStartRow;
  for (const carrier of model.allCarriers) {
    for (const cause of carrier.rootCauses) {
      if (row > 200) break;
      sheet.getCell(row, 4).value = carrier.name;
      sheet.getCell(row, 5).value = cause.label;
      sheet.getCell(row, 6).value = cause.count;
      formatCount(sheet.getCell(row, 6));
      row += 1;
    }
    if (row > 200) break;
  }
}

function busiestCarrierAtHour(model: ReportModel, hour: number): CarrierReport | undefined {
  return [...model.allCarriers]
    .filter((carrier) => carrier.hourlyTotals[hour] > 0)
    .sort(
      (left, right) =>
        right.hourlyTotals[hour] - left.hourlyTotals[hour] ||
        left.name.localeCompare(right.name, "tr-TR", { sensitivity: "base" }),
    )[0];
}

function writeHours(workbook: import("exceljs").Workbook, model: ReportModel): void {
  const layout = REPORT_LAYOUT.hours;
  const sheet = workbook.getWorksheet(layout.sheet)!;
  sheet.getCell(layout.period).value = `${periodText(model)} • Kayıt saati esas alınmıştır.`;
  clearValues(sheet, 6, 29, 1, 10);
  for (let hour = 0; hour < 24; hour += 1) {
    const row = layout.hourlyStartRow + hour;
    const busiest = busiestCarrierAtHour(model, hour);
    sheet.getCell(row, 1).value = `${String(hour).padStart(2, "0")}:00`;
    sheet.getCell(row, 2).value = model.hourlyTotals[hour];
    formatCount(sheet.getCell(row, 2));
    sheet.getCell(row, 3).value = busiest?.name ?? "";
    sheet.getCell(row, 4).value = busiest?.hourlyTotals[hour] ?? 0;
    formatCount(sheet.getCell(row, 4));
  }
  model.topCarriers.forEach((carrier, index) => {
    const row = layout.carrierStartRow + index;
    sheet.getCell(row, 6).value = carrier.name;
    sheet.getCell(row, 7).value = carrier.registrations;
    formatCount(sheet.getCell(row, 7));
    sheet.getCell(row, 8).value = carrier.dailyAverage;
    setNumberFormat(sheet.getCell(row, 8), "#,##0.0");
    sheet.getCell(row, 9).value = `${String(carrier.peakHour.hour).padStart(2, "0")}:00`;
    sheet.getCell(row, 10).value = carrier.peakHour.count;
    formatCount(sheet.getCell(row, 10));
  });
}

function writeDetail(
  sheet: import("exceljs").Worksheet,
  carrier: CarrierReport | undefined,
  slot: number,
  model: ReportModel,
): void {
  const layout = REPORT_LAYOUT.detail;
  sheet.unMergeCells(`A${layout.legacyRootRow}:D${layout.legacyRootRow}`);
  clearValues(sheet, 11, 200, 1, 12);
  sheet.getCell(layout.period).value = `${periodText(model)} • Red hesabı standardize edilmiş kök sebeplere göre hazırlanmıştır.`;
  if (!carrier) {
    sheet.name = `Detay ${String(slot).padStart(2, "0")}`;
    sheet.getCell(layout.title).value = `DETAY ${String(slot).padStart(2, "0")} | VERİ YOK`;
    sheet.getCell(layout.registrations).value = null;
    sheet.getCell(layout.rejections).value = null;
    sheet.getCell(layout.rejectionRate).value = null;
    sheet.getCell("A11").value = "Bu dönem için veri yok";
    sheet.getCell("A11").font = { name: "Arial", size: 12, italic: true, color: { argb: "FF5B6573" } };
    return;
  }

  sheet.getCell(layout.title).value = `${carrier.name} | DETAY ANALİZİ`;
  sheet.getCell(layout.registrations).value = carrier.registrations;
  formatCount(sheet.getCell(layout.registrations));
  sheet.getCell(layout.rejections).value = carrier.rejections;
  formatCount(sheet.getCell(layout.rejections));
  sheet.getCell(layout.rejectionRate).value = carrier.rejectionRate;
  setNumberFormat(sheet.getCell(layout.rejectionRate), "0.0%");

  carrier.products.forEach((product, index) => {
    const row = layout.productStartRow + index;
    sheet.getCell(row, 1).value = product.name;
    sheet.getCell(row, 2).value = product.registrations;
    formatCount(sheet.getCell(row, 2));
    sheet.getCell(row, 3).value = product.rejections;
    formatCount(sheet.getCell(row, 3));
    sheet.getCell(row, 4).value = product.rejectionRate;
    setNumberFormat(sheet.getCell(row, 4), "0.0%");
  });
  for (let hour = 0; hour < 24; hour += 1) {
    const row = layout.hourStartRow + hour;
    sheet.getCell(row, 6).value = `${String(hour).padStart(2, "0")}:00`;
    sheet.getCell(row, 7).value = carrier.hourlyTotals[hour];
    formatCount(sheet.getCell(row, 7));
  }

  const rootSectionRow = layout.rootStartRow;
  const rootColumn = layout.rootStartColumn;
  sheet.getColumn(rootColumn).width = 42;
  sheet.getColumn(rootColumn + 1).width = 12;
  sheet.getColumn(rootColumn + 2).width = 12;
  sheet.getColumn(rootColumn + 3).width = 14;
  sheet.mergeCells(rootSectionRow, rootColumn, rootSectionRow, rootColumn + 3);
  sheet.getCell(rootSectionRow, rootColumn).value = "Kök Sebepler";
  styleSectionRow(sheet, rootSectionRow, rootColumn + 3, rootColumn);
  sheet.getCell(rootSectionRow + 1, rootColumn).value = "Kök Sebep";
  sheet.getCell(rootSectionRow + 1, rootColumn + 1).value = "Red Kaydı";
  styleHeaderRow(sheet, rootSectionRow + 1, rootColumn + 1, rootColumn);
  carrier.rootCauses.forEach((cause, index) => {
    const row = rootSectionRow + 2 + index;
    sheet.getCell(row, rootColumn).value = cause.label;
    sheet.getCell(row, rootColumn + 1).value = cause.count;
    formatCount(sheet.getCell(row, rootColumn + 1));
  });

  if (carrier.specialBreakdown) {
    const specialRow = rootSectionRow + carrier.rootCauses.length + 4;
    sheet.mergeCells(specialRow, rootColumn, specialRow, rootColumn + 3);
    sheet.getCell(specialRow, rootColumn).value = "Ravago / Strene ve Diğer Operasyonlar";
    styleSectionRow(sheet, specialRow, rootColumn + 3, rootColumn);
    ["Kırılım", "Toplam", "Red", "Red Oranı"].forEach((value, index) => {
      sheet.getCell(specialRow + 1, rootColumn + index).value = value;
    });
    styleHeaderRow(sheet, specialRow + 1, rootColumn + 3, rootColumn);
    const groups = [
      ["Ravago / Strene", carrier.specialBreakdown.ravagoStrene],
      ["Ravago dışı", carrier.specialBreakdown.other],
    ] as const;
    groups.forEach(([label, values], index) => {
      const row = specialRow + 2 + index;
      sheet.getCell(row, rootColumn).value = label;
      sheet.getCell(row, rootColumn + 1).value = values.registrations;
      sheet.getCell(row, rootColumn + 2).value = values.rejections;
      sheet.getCell(row, rootColumn + 3).value = values.registrations
        ? values.rejections / values.registrations
        : 0;
      formatCount(sheet.getCell(row, rootColumn + 1));
      formatCount(sheet.getCell(row, rootColumn + 2));
      setNumberFormat(sheet.getCell(row, rootColumn + 3), "0.0%");
    });
  }
}

async function loadTemplateBuffer(): Promise<ArrayBuffer> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/terminal-ilk20-template.xlsx`);
  if (!response.ok) throw new Error("Excel rapor şablonu yüklenemedi.");
  return response.arrayBuffer();
}

export async function buildReportWorkbook(
  model: ReportModel,
  templateBuffer?: ArrayBuffer,
): Promise<Uint8Array> {
  const module = await import("exceljs");
  const workbook = new module.default.Workbook();
  const source = templateBuffer ?? (await loadTemplateBuffer());
  await workbook.xlsx.load(source as Parameters<typeof workbook.xlsx.load>[0]);
  writeSummary(workbook, model);
  writeRootCauses(workbook, model);
  writeHours(workbook, model);

  const usedNames = new Set(workbook.worksheets.slice(0, 3).map((sheet) => sheet.name));
  for (let index = 0; index < REPORT_LAYOUT.detail.slotCount; index += 1) {
    const sheet = workbook.worksheets[index + 3];
    const carrier = model.topCarriers[index];
    if (carrier) sheet.name = makeUniqueSheetName(index + 1, carrier.name, usedNames);
    writeDetail(sheet, carrier, index + 1, model);
    sheet.state = "visible";
  }

  workbook.creator = "Sey-Pregate Nakliyeci Ayrım Kontrol";
  workbook.modified = new Date();
  const output = await workbook.xlsx.writeBuffer();
  return new Uint8Array(output);
}
