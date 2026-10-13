import { describe, expect, it } from "vitest";
import { suggestColumnMapping } from "@/analysis/header-mapping";

describe("suggestColumnMapping", () => {
  it.each(["Nakliyeci", "Nakliyeci Adı", "Firma", "Taşıyıcı"])(
    "maps %s to the carrier field",
    (carrierHeader) => {
      const result = suggestColumnMapping([
        "Kayıt Tarihi",
        "Saat",
        "Departman",
        carrierHeader,
        "Ürün",
        "Durum",
        "Kök Sebep",
      ]);

      expect(result.mapping.carrier).toBe(3);
      expect(result.requiresUserMapping).toBe(false);
    },
  );

  it.each(["Departman", "Tesis"])("maps %s to department", (header) => {
    const result = suggestColumnMapping([
      "Tarih",
      header,
      "Firma",
      "Malzeme",
      "Statü",
      "Red Açıklaması",
    ]);
    expect(result.mapping.department).toBe(1);
  });

  it.each(["Red Açıklaması", "Kök Sebep", "İptal Açıklaması"])(
    "maps %s to rejection reason",
    (header) => {
      const result = suggestColumnMapping([
        "Tarih",
        "Departman",
        "Firma",
        "Ürün",
        "Durum",
        header,
      ]);
      expect(result.mapping.rejectionReason).toBe(5);
    },
  );

  it("requires user mapping when a required field is missing", () => {
    const result = suggestColumnMapping([
      "Tarih",
      "Departman",
      "Firma",
      "Ürün",
      "Durum",
    ]);
    expect(result.requiresUserMapping).toBe(true);
    expect(result.missingFields).toContain("rejectionReason");
  });
});
