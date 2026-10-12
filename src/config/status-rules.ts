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
