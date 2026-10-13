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
  const signature = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 2));
  if (signature.length < 2 || signature[0] !== 0x50 || signature[1] !== 0x4b) {
    throw new Error("Excel dosyası açılamadı. Dosya bozuk veya şifreli olabilir.");
  }

  try {
    const { read, utils } = await import("xlsx");
    const workbook = read(new Uint8Array(buffer), {
      type: "array",
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      cellStyles: false,
      cellText: false,
    });

    let best:
      | (WorkbookCandidate & { score: number; populatedRows: number })
      | undefined;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetRows = utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
        blankrows: true,
        defval: null,
      });
      const maxColumn = sheetRows.reduce((maximum, row) => Math.max(maximum, row.length), 1);
      const scanLimit = Math.min(sheetRows.length, 30);
      for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber += 1) {
        const headers = Array.from({ length: maxColumn }, (_, columnIndex) =>
          String(displayValue(sheetRows[rowNumber - 1]?.[columnIndex]) ?? "").trim(),
        );
        const suggestion = suggestColumnMapping(headers);
        const matched = Object.keys(suggestion.mapping).length;
        const requiredMatched = 6 - suggestion.missingFields.length;
        const populatedRows = Math.max(sheetRows.length - rowNumber, 0);
        const score = requiredMatched * 100 + matched * 10 + Math.min(populatedRows, 99);
        if (requiredMatched < 3 || (best && best.score >= score)) continue;

        const rows = sheetRows
          .slice(rowNumber)
          .map((sourceRow) =>
            Array.from({ length: maxColumn }, (_, columnIndex) =>
              displayValue(sourceRow[columnIndex]),
            ),
          )
          .filter((values) =>
            values.some((value) => value !== null && value !== undefined && value !== ""),
          );
        best = {
          sheetName,
          headerRowNumber: rowNumber,
          headers,
          rows,
          suggestion,
          score,
          populatedRows,
        };
      }
    }

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
