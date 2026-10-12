export const REPORT_LAYOUT = {
  summary: {
    sheet: "Yönetim Özeti",
    period: "A2",
    carriers: "A5",
    registrations: "D5",
    rejections: "G5",
    rejectionRate: "J5",
    rankingStartRow: 11,
    rankingEndRow: 30,
  },
  roots: {
    sheet: "Kök Sebep Analizi",
    period: "A2",
    generalStartRow: 6,
    carrierStartRow: 6,
  },
  hours: {
    sheet: "Saat Yoğunluk",
    period: "A2",
    hourlyStartRow: 6,
    carrierStartRow: 6,
  },
  detail: {
    firstSheetIndex: 4,
    slotCount: 20,
    title: "A1",
    period: "A2",
    registrations: "A5",
    rejections: "D5",
    rejectionRate: "G5",
    productStartRow: 11,
    hourStartRow: 11,
    rootDefaultRow: 103,
  },
} as const;

export const REPORT_COLORS = {
  navy: "FF12355B",
  blue: "FF1F6AA5",
  pale: "FFEAF2F8",
  border: "FFD5E2EC",
  white: "FFFFFFFF",
} as const;
