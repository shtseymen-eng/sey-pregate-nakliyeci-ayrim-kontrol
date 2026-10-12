import { describe, expect, it } from "vitest";
import {
  classifyRecord,
  collectUnknownStatuses,
} from "@/analysis/status-classifier";
import type { NormalizedRecord } from "@/types/import";

function record(status: string, rejectionReason = ""): NormalizedRecord {
  return {
    sourceRow: 2,
    occurredAt: new Date(2026, 4, 17, 9),
    hour: 9,
    department: "Poliport Terminal",
    carrier: "Firma 01",
    product: "Ürün A",
    status,
    rejectionReason,
  };
}

describe("status classification", () => {
  it("classifies red and excluded operational statuses", () => {
    expect(classifyRecord(record("Red"), {})).toBe("red");
    expect(classifyRecord(record("PREGATE"), {})).toBe("exclude");
    expect(classifyRecord(record("Sırada"), {})).toBe("exclude");
    expect(classifyRecord(record(" beklemede "), {})).toBe("exclude");
  });

  it("uses rejection reason when status is blank", () => {
    expect(classifyRecord(record("", "Evrak eksik"), {})).toBe("red");
    expect(classifyRecord(record("", ""), {})).toBe("not-red");
  });

  it("lets user rules override default classification", () => {
    expect(classifyRecord(record("Red"), { red: "not-red" })).toBe("not-red");
    expect(classifyRecord(record("Yeni Durum"), { "yeni durum": "red" })).toBe(
      "red",
    );
  });

  it("collects unknown nonblank statuses with counts", () => {
    const unknown = collectUnknownStatuses(
      [record("Yeni Durum"), record("yeni durum"), record("Başka")],
      {},
    );
    expect(unknown).toEqual([
      { normalized: "yeni durum", label: "Yeni Durum", count: 2 },
      { normalized: "baska", label: "Başka", count: 1 },
    ]);
  });
});
