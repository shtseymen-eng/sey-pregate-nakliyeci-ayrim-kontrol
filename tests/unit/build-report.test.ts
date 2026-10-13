import { describe, expect, it } from "vitest";
import { buildReportModel } from "@/analysis/build-report";
import type { NormalizedRecord } from "@/types/import";

function record(
  carrier: string,
  day: number,
  hour: number,
  status: string,
  product: string,
  rejectionReason = "",
  customer?: string,
): NormalizedRecord {
  return {
    sourceRow: day * 10 + hour,
    occurredAt: new Date(2026, 4, day, hour),
    hour,
    department: "Poliport Terminal",
    carrier,
    product,
    status,
    rejectionReason,
    customer,
  };
}

const importSummary = {
  rowsRead: 7,
  rowsIncluded: 7,
  rowsExcludedDepartment: 0,
  invalidRows: 0,
  warnings: [],
};

describe("buildReportModel", () => {
  it("calculates totals, carrier details, products, hours and root causes", () => {
    const records = [
      record("Firma A", 1, 8, "Onaylandı", "Ürün X"),
      record("Firma A", 1, 9, "Red", "Ürün X", "SRC5 yoktur"),
      record("Firma A", 2, 9, "Pregate", "Ürün Y"),
      record("Firma B", 1, 10, "Red", "Ürün Z", "SRC5 yoktur"),
      record("Firma B", 2, 10, "Red", "Ürün Z", "Çekici ADR evrakı eksik"),
      record("Alışan Lojistik", 2, 11, "Red", "Ürün R", "Çekici ADR evrakı eksik", "Ravago"),
      record("Alışan Lojistik", 3, 12, "Onaylandı", "Ürün D", "", "Diğer"),
    ];

    const model = buildReportModel({ records, statusRules: {}, importSummary });

    expect(model.totals).toEqual({
      carriers: 3,
      registrations: 7,
      rejections: 4,
      rejectionRate: 4 / 7,
    });
    expect(model.period.start).toEqual(new Date(2026, 4, 1, 8));
    expect(model.period.end).toEqual(new Date(2026, 4, 3, 12));
    expect(model.hourlyTotals.reduce((sum, value) => sum + value, 0)).toBe(7);
    expect(model.rootCauses.map((item) => [item.label, item.count])).toEqual([
      ["Çekici ADR/T9 evrakı eksik", 2],
      ["Sürücü SRC5 belgesi eksik", 2],
    ]);

    const carrierA = model.topCarriers.find((item) => item.name === "Firma A")!;
    expect(carrierA.registrations).toBe(3);
    expect(carrierA.rejections).toBe(1);
    expect(carrierA.activeDays).toBe(2);
    expect(carrierA.dailyAverage).toBe(1.5);
    expect(carrierA.peakHour).toEqual({ hour: 9, count: 2 });
    expect(carrierA.topProduct).toEqual({ name: "Ürün X", count: 2 });
    expect(carrierA.products).toEqual([
      { name: "Ürün X", registrations: 2, rejections: 1, rejectionRate: 0.5 },
      { name: "Ürün Y", registrations: 1, rejections: 0, rejectionRate: 0 },
    ]);

    const alisan = model.topCarriers.find((item) => item.name === "Alışan Lojistik")!;
    expect(alisan.specialBreakdown).toEqual({
      ravagoStrene: { registrations: 1, rejections: 1 },
      other: { registrations: 1, rejections: 0 },
    });
  });

  it("keeps only top 20 and resolves equal totals alphabetically", () => {
    const records = Array.from({ length: 22 }, (_, index) =>
      record(`Firma ${String.fromCharCode(65 + index)}`, 1, index % 24, "Onaylandı", "Ürün"),
    );
    const model = buildReportModel({
      records,
      statusRules: {},
      importSummary: { ...importSummary, rowsRead: 22, rowsIncluded: 22 },
    });

    expect(model.topCarriers).toHaveLength(20);
    expect(model.allCarriers).toHaveLength(22);
    expect(model.topCarriers[0].name).toBe("Firma A");
    expect(model.topCarriers[19].name).toBe("Firma T");
  });

  it("blocks generation while an unknown status remains", () => {
    expect(() =>
      buildReportModel({
        records: [record("Firma A", 1, 8, "Yeni Durum", "Ürün")],
        statusRules: {},
        importSummary: { ...importSummary, rowsRead: 1, rowsIncluded: 1 },
      }),
    ).toThrow("sınıflandırılmamış");
  });

  it("counts each red reason once and labels red rows without a reason", () => {
    const model = buildReportModel({
      records: [
        record(
          "Firma A",
          1,
          8,
          "Red",
          "Ürün X",
          "SRC5 yoktur; SRC 5 belgesi yoktur",
        ),
        record("Firma B", 1, 9, "Red", "Ürün Y", ""),
        record("Firma C", 1, 10, "Onaylandı", "Ürün Z", "Firma adı ürün adı"),
      ],
      statusRules: {},
      importSummary: { ...importSummary, rowsRead: 3, rowsIncluded: 3 },
    });

    expect(model.rootCauses.map((item) => [item.label, item.count])).toEqual([
      ["Red nedeni belirtilmemiş", 1],
      ["Sürücü SRC5 belgesi eksik", 1],
    ]);
  });

  it("separates total registrations from actual rejections for terminal statuses", () => {
    const model = buildReportModel({
      records: [
        record("Firma A", 1, 8, "Kapı Çıkış Tamamlandı.", "Ürün X"),
        record(
          "Firma A",
          1,
          9,
          "Sürücü isteği ile kayıt silindi",
          "Ürün X",
          "Sürücü isteği ile kayıt silindi",
        ),
        record(
          "Firma A",
          1,
          10,
          "Pregate kaydi yapildi.",
          "Ürün X",
          "Pregate kaydi yapildi.",
        ),
        record("Firma A", 1, 11, "Sevkiyat Onayı Verildi", "Ürün X"),
      ],
      statusRules: {},
      importSummary: { ...importSummary, rowsRead: 4, rowsIncluded: 4 },
    });

    expect(model.totals).toMatchObject({
      registrations: 4,
      rejections: 1,
      rejectionRate: 0.25,
    });
    expect(model.topCarriers[0]).toMatchObject({
      registrations: 4,
      rejections: 1,
      rejectionRate: 0.25,
    });
    expect(model.rootCauses.map((item) => [item.label, item.count])).toEqual([
      ["Firma talebi / iptal", 1],
    ]);
  });
});
