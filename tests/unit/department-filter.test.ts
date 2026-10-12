import { describe, expect, it } from "vitest";
import { filterPoliportTerminal } from "@/analysis/department-filter";
import type { NormalizedRecord } from "@/types/import";

function record(department: string, sourceRow: number): NormalizedRecord {
  return {
    sourceRow,
    occurredAt: new Date(2026, 0, 1, 8),
    hour: 8,
    department,
    carrier: `Firma ${sourceRow}`,
    product: "Ürün",
    status: "Onaylandı",
    rejectionReason: "",
  };
}

describe("filterPoliportTerminal", () => {
  it("includes only normalized Poliport Terminal department values", () => {
    const result = filterPoliportTerminal([
      record("Poliport Terminal", 1),
      record(" poliport terminal ", 2),
      record("POLİPORT TERMİNAL", 3),
      record("Poliport Liman", 4),
      record("Poliport Tank", 5),
      record("", 6),
      record("Başka Departman", 7),
    ]);

    expect(result.records.map((item) => item.sourceRow)).toEqual([1, 2, 3]);
    expect(result.summary).toEqual({
      rowsRead: 7,
      rowsIncluded: 3,
      rowsExcludedDepartment: 4,
    });
  });
});
