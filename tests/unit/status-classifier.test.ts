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

  it("keeps completed and approved operations out of the rejection count", () => {
    expect(classifyRecord(record("Kapı Çıkış Tamamlandı.", "Eski açıklama"), {})).toBe(
      "not-red",
    );
    expect(classifyRecord(record("Sevkiyat Onayı Verildi"), {})).toBe("not-red");
    expect(classifyRecord(record("Liman Operasyonları Tamamlandı"), {})).toBe(
      "not-red",
    );
    expect(
      classifyRecord(record("Araç Girişi Yapıldı", "Araç Girişi Yapıldı"), {}),
    ).toBe("not-red");
  });

  it("keeps pregate and pending planning records out of the rejection count", () => {
    expect(
      classifyRecord(record("Pregate kaydi yapildi.", "Pregate kaydi yapildi."), {}),
    ).toBe("exclude");
    expect(
      classifyRecord(record("Sevkiyat Planlama Yapıldı. Onay Bekleniyor."), {}),
    ).toBe("exclude");
    expect(classifyRecord(record("SIRADA 25900", "SIRADA 25900"), {})).toBe(
      "exclude",
    );
  });

  it("does not hide actual cancellations merely because they mention the pregate area", () => {
    expect(
      classifyRecord(
        record(
          "ARAÇ PREGATE SAHASINDA ARIZA YAPMIŞTIR",
          "ARAÇ PREGATE SAHASINDA ARIZA YAPMIŞTIR",
        ),
        {},
      ),
    ).toBe("red");
  });

  it("classifies cancellation explanations and rejection keywords as red", () => {
    expect(
      classifyRecord(record("Nakliyeci kaydı", "Sürücü isteği ile kayıt silindi"), {}),
    ).toBe("red");
    expect(classifyRecord(record("Sorumluluk evrakı yoktur"), {})).toBe("red");
    expect(classifyRecord(record("Çekici T9 muayenesi yok"), {})).toBe("red");
    expect(classifyRecord(record("Tank basınç raporu eksik"), {})).toBe("red");
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

  it("asks only about statuses that automatic business rules cannot classify", () => {
    const unknown = collectUnknownStatuses(
      [
        record("Kapı Çıkış Tamamlandı."),
        record("Pregate kaydi yapildi.", "Pregate kaydi yapildi."),
        record("Nakliyeci kaydı", "Yanlış tesise geldiği için iptal"),
        record("Yeni Durum"),
      ],
      {},
    );

    expect(unknown).toEqual([
      { normalized: "yeni durum", label: "Yeni Durum", count: 1 },
    ]);
  });
});
