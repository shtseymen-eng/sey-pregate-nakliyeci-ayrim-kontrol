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
): void {
  for (let column = 1; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: REPORT_COLORS.blue } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: REPORT_COLORS.white } };
    cell.alignment = { vertical: "middle" };
  }
}

function styleHeaderRow(
  sheet: import("exceljs").Worksheet,
  row: number,
  endColumn: number,
): void {
  for (let column = 1; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: REPORT_COLORS.navy } };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: REPORT_COLORS.white } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: REPORT_COLORS.white } },
      left: { style: "thin", color: { argb: REPORT_COLORS.white } },
      bottom: { style: "thin", color: { argb: REPORT_COLORS.white } },
      right: { style: "thin", color: { argb: REPORT_COLORS.white } },
    };
  }
}

function writeSummary(workbook: import("exceljs").Workbook, model: ReportModel): void {
  const layout = REPORT_LAYOUT.summary;
  const sheet = workbook.getWorksheet(layout.sheet)!;
  sheet.getCell(layout.period).value = `${periodText(model)} • Pregate kaydı, sırada ve beklemede durumları red hesabına dahil değildir. Bir kayıt birden fazla kök sebep içerirse her sebepte ayrı sayılır.`;
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
  clearValues(sheet, 11, 200, 1, 10);
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

  const rootSectionRow = Math.max(
    layout.rootDefaultRow,
    layout.productStartRow + carrier.products.length + 3,
  );
  if (rootSectionRow !== layout.rootDefaultRow) {
    clearValues(sheet, layout.rootDefaultRow, layout.rootDefaultRow + 1, 1, 4);
    sheet.mergeCells(`A${rootSectionRow}:D${rootSectionRow}`);
  }
  sheet.getCell(rootSectionRow, 1).value = "Kök Sebepler";
  styleSectionRow(sheet, rootSectionRow, 4);
  sheet.getCell(rootSectionRow + 1, 1).value = "Kök Sebep";
  sheet.getCell(rootSectionRow + 1, 2).value = "Red Kaydı";
  styleHeaderRow(sheet, rootSectionRow + 1, 2);
  carrier.rootCauses.forEach((cause, index) => {
    const row = rootSectionRow + 2 + index;
    sheet.getCell(row, 1).value = cause.label;
    sheet.getCell(row, 2).value = cause.count;
    formatCount(sheet.getCell(row, 2));
  });

  if (carrier.specialBreakdown) {
    const specialRow = rootSectionRow + carrier.rootCauses.length + 4;
    sheet.mergeCells(`A${specialRow}:D${specialRow}`);
    sheet.getCell(specialRow, 1).value = "Ravago / Strene ve Diğer Operasyonlar";
    styleSectionRow(sheet, specialRow, 4);
    sheet.getRow(specialRow + 1).values = ["Kırılım", "Toplam", "Red", "Red Oranı"];
    styleHeaderRow(sheet, specialRow + 1, 4);
    const groups = [
      ["Ravago / Strene", carrier.specialBreakdown.ravagoStrene],
      ["Ravago dışı", carrier.specialBreakdown.other],
    ] as const;
    groups.forEach(([label, values], index) => {
      const row = specialRow + 2 + index;
      sheet.getRow(row).values = [
        label,
        values.registrations,
        values.rejections,
        values.registrations ? values.rejections / values.registrations : 0,
      ];
      formatCount(sheet.getCell(row, 2));
      formatCount(sheet.getCell(row, 3));
      setNumberFormat(sheet.getCell(row, 4), "0.0%");
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
