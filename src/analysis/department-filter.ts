import type {
  DepartmentFilterResult,
  NormalizedRecord,
} from "@/types/import";
import { normalizeForComparison } from "@/utils/text";

const POLIPORT_TERMINAL = "poliport terminal";

export function filterPoliportTerminal(
  records: NormalizedRecord[],
): DepartmentFilterResult {
  const included = records.filter(
    (record) => normalizeForComparison(record.department) === POLIPORT_TERMINAL,
  );

  return {
    records: included,
    summary: {
      rowsRead: records.length,
      rowsIncluded: included.length,
      rowsExcludedDepartment: records.length - included.length,
    },
  };
}
