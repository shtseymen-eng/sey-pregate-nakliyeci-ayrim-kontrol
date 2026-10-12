import type {
  ColumnMapping,
  NormalizationResult,
  NormalizedRecord,
} from "@/types/import";
import { combineDateTime } from "@/utils/date-time";
import { cleanDisplayText, normalizeForComparison } from "@/utils/text";

const TARGET_DEPARTMENT = "poliport terminal";

export function normalizeRecords(
  rows: unknown[][],
  mapping: ColumnMapping,
  headerRowNumber = 1,
): NormalizationResult {
  const records: NormalizedRecord[] = [];
  const invalidRows: NormalizationResult["invalidRows"] = [];
  const warnings: string[] = [];
  let included = 0;

  rows.forEach((row, index) => {
    const sourceRow = headerRowNumber + index + 1;
    const department = cleanDisplayText(row[mapping.department]);
    if (normalizeForComparison(department) !== TARGET_DEPARTMENT) return;
    included += 1;

    const carrier = cleanDisplayText(row[mapping.carrier]);
    const occurredAt = combineDateTime(
      row[mapping.date],
      mapping.time === undefined ? undefined : row[mapping.time],
    );
    if (!carrier) {
      invalidRows.push({ sourceRow, reason: "Nakliyeci boş" });
      return;
    }
    if (!occurredAt) {
      invalidRows.push({ sourceRow, reason: "Kayıt tarihi veya saati geçersiz" });
      return;
    }

    const product = cleanDisplayText(row[mapping.product]);
    const status = cleanDisplayText(row[mapping.status]);
    const rejectionReason = cleanDisplayText(row[mapping.rejectionReason]);
    if (!product) warnings.push(`${sourceRow}. satırda ürün boş`);
    if (!status) warnings.push(`${sourceRow}. satırda durum boş`);

    records.push({
      sourceRow,
      occurredAt,
      hour: occurredAt.getHours(),
      department,
      carrier,
      product: product || "Belirtilmemiş",
      status,
      rejectionReason,
      customer:
        mapping.customer === undefined
          ? undefined
          : cleanDisplayText(row[mapping.customer]),
    });
  });

  const blockingErrors: string[] = [];
  if (included === 0) {
    blockingErrors.push("Dosyada Poliport Terminal kaydı bulunamadı.");
  } else if (records.length === 0) {
    blockingErrors.push("Poliport Terminal için hesaplamaya uygun kayıt kalmadı.");
  }

  return {
    records,
    invalidRows,
    warnings,
    blockingErrors,
    departmentSummary: {
      rowsRead: rows.length,
      rowsIncluded: included,
      rowsExcludedDepartment: rows.length - included,
    },
  };
}
