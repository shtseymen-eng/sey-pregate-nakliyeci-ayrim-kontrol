import ExcelJS from "exceljs";

export interface SyntheticWorkbookOptions {
  sheetName?: string;
  prefaceRows?: string[][];
  headers?: string[];
  rows?: unknown[][];
  emptyFirstSheet?: boolean;
}

export async function makeSyntheticWorkbook(
  options: SyntheticWorkbookOptions = {},
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  if (options.emptyFirstSheet) workbook.addWorksheet("Açıklama");
  const sheet = workbook.addWorksheet(options.sheetName ?? "Araç Kayıt Sorgu");
  for (const row of options.prefaceRows ?? [["Araç kayıtları"]]) sheet.addRow(row);
  sheet.addRow(
    options.headers ?? [
      "Kayıt Tarihi",
      "Saat",
      "Departman",
      "Nakliyeci Adı",
      "Ürün",
      "Durum",
      "Red Açıklaması",
      "Müşteri",
    ],
  );
  for (const row of options.rows ?? []) sheet.addRow(row);
  const bytes = await workbook.xlsx.writeBuffer();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
