const TURKISH_ASCII_MAP: Record<string, string> = {
  ı: "i",
  ş: "s",
  ğ: "g",
  ü: "u",
  ö: "o",
  ç: "c",
};

export function cleanDisplayText(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeForComparison(value: unknown): string {
  return cleanDisplayText(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/[ışğüöç]/g, (character) => TURKISH_ASCII_MAP[character])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
