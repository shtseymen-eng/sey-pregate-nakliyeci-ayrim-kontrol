import { describe, expect, it } from "vitest";
import { splitAndNormalizeRootCauses } from "@/analysis/root-causes";

describe("root cause normalization", () => {
  it("splits multiple reasons and maps known wording", () => {
    const matches = splitAndNormalizeRootCauses(
      "SRC5 yoktur; Çekici ADR evrakı eksik\n• Sürücü tesisten ayrıldı",
    );

    expect(matches.map((item) => item.label)).toEqual([
      "Sürücü SRC5 belgesi eksik",
      "Çekici ADR/T9 evrakı eksik",
      "Sürücü kart almadan ayrıldı veya tesisten çıktı",
    ]);
    expect(matches.every((item) => item.matched)).toBe(true);
  });

  it("preserves unmatched text and ignores empty fragments", () => {
    expect(splitAndNormalizeRootCauses("  Özel açıklama ; ; ")).toEqual([
      {
        id: "unmatched",
        label: "Özel açıklama",
        original: "Özel açıklama",
        matched: false,
      },
    ]);
    expect(splitAndNormalizeRootCauses(" ")).toEqual([]);
  });

  it("groups carrier, driver, wrong-site and overtime cancellations as company requests", () => {
    const matches = splitAndNormalizeRootCauses(
      "Nakliyeci iptali; Yanlış tesise geldi; Sürücü isteği ile kayıt silindi; Mesai onayı yok; Sürücü kaydını sildirdi; Firma yarına erteledi; Hatalı kayıt; Sürücü talebi; Yükleme yarın olacak",
    );

    expect(matches.map((item) => item.label)).toEqual([
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
      "Firma talebi / iptal",
    ]);
    expect(matches.every((item) => item.matched)).toBe(true);
  });
});
