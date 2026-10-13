import type { StatusRuleMap } from "@/types/import";

export const DEFAULT_STATUS_RULES: StatusRuleMap = {
  red: "red",
  ret: "red",
  reddedildi: "red",
  reddedilmis: "red",
  uygunsuz: "red",
  iptal: "red",
  "iptal edildi": "red",
  onaylandi: "not-red",
  kabul: "not-red",
  tamamlandi: "not-red",
  "giris yapti": "not-red",
  "cikis yapti": "not-red",
  pregate: "exclude",
  "pre gate": "exclude",
  sirada: "exclude",
  beklemede: "exclude",
};

export const NOT_RED_STATUS_PATTERNS = [
  "kapi cikis tamamlandi",
  "arac girisi yapildi",
  "sevkiyat onayi verildi",
  "liman operasyonlari tamamlandi",
];

export const EXCLUDED_STATUS_PATTERNS = [
  "pregate kaydi yapildi",
  "pre gate kaydi yapildi",
  "planlama yapildi. onay bekleniyor",
  "sirada ",
  "beklemede ",
];

export const RED_STATUS_PATTERNS = [
  "yok",
  "iptal",
  "kayit sil",
  "yanlis tesis",
  "surucu beyan",
  "surucu istek",
  "sofor beyan",
  "sofor istek",
  "mesai gerekli",
  "sorumluluk",
  "cekici",
  "dorse",
  "t9",
  "muayene",
  "sigorta",
  "yuksekte",
  "tank",
  "basin",
];
