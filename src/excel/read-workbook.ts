import type { WorkbookCandidate } from "@/types/import";
import { suggestColumnMapping } from "@/analysis/header-mapping";

function displayValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) return (value as { result: unknown }).result;
    if ("richText" in value) {
      return (value as { richText: Array<{ text: string }> }).richText
        .map((part) => part.text)
        .join("");
    }
    if ("text" in value) return (value as { text: string }).text;
  }
  return value;
}

export async function readWorkbook(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<WorkbookCandidate> {
  if (!fileName.toLocaleLowerCase("tr-TR").endsWith(".xlsx")) {
    throw new Error("Yalnızca .xlsx dosyaları desteklenir.");
  }

  try {
    const module = await import("exceljs");
    const workbook = new module.default.Workbook();
    await workbook.xlsx.load(buffer as unknown as Buffer);

    let best:
      | (WorkbookCandidate & { score: number; populatedRows: number })
      | undefined;

    workbook.eachSheet((sheet) => {
      const maxColumn = Math.max(sheet.columnCount, 1);
      const scanLimit = Math.min(sheet.rowCount, 30);
      for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber += 1) {
        const headers = Array.from({ length: maxColumn }, (_, columnIndex) =>
          String(displayValue(sheet.getRow(rowNumber).getCell(columnIndex + 1).value) ?? "").trim(),
        );
        const suggestion = suggestColumnMapping(headers);
        const matched = Object.keys(suggestion.mapping).length;
        const requiredMatched = 6 - suggestion.missingFields.length;
        const populatedRows = Math.max(sheet.rowCount - rowNumber, 0);
        const score = requiredMatched * 100 + matched * 10 + Math.min(populatedRows, 99);
        if (requiredMatched < 3 || (best && best.score >= score)) continue;

        const rows: unknown[][] = [];
        for (let dataRow = rowNumber + 1; dataRow <= sheet.rowCount; dataRow += 1) {
          const values = Array.from({ length: maxColumn }, (_, columnIndex) =>
            displayValue(sheet.getRow(dataRow).getCell(columnIndex + 1).value),
          );
          if (values.some((value) => value !== null && value !== undefined && value !== "")) {
            rows.push(values);
          }
        }
        best = {
          sheetName: sheet.name,
          headerRowNumber: rowNumber,
          headers,
          rows,
          suggestion,
          score,
          populatedRows,
        };
      }
    });

    if (!best) throw new Error("Veri sayfası veya başlık satırı bulunamadı.");
    return {
      sheetName: best.sheetName,
      headerRowNumber: best.headerRowNumber,
      headers: best.headers,
      rows: best.rows,
      suggestion: best.suggestion,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("bulunamadı")) throw error;
    throw new Error("Excel dosyası açılamadı. Dosya bozuk veya şifreli olabilir.");
  }
}
