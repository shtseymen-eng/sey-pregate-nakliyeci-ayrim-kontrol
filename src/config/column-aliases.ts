import type { SemanticField } from "@/types/import";

export const REQUIRED_FIELDS: SemanticField[] = [
  "date",
  "department",
  "carrier",
  "product",
  "status",
  "rejectionReason",
];

export const COLUMN_ALIASES: Record<SemanticField, string[]> = {
  date: [
    "kayıt tarihi",
    "kayit tarihi",
    "tarih",
    "giriş tarihi",
    "araç kayıt tarihi",
    "tarih saat",
    "kayıt tarih saat",
  ],
  time: ["saat", "kayıt saati", "giriş saati", "işlem saati"],
  department: [
    "departman",
    "departman adı",
    "tesis",
    "tesis adı",
    "lokasyon",
    "operasyon yeri",
  ],
  carrier: [
    "nakliyeci",
    "nakliyeci adı",
    "firma",
    "firma adı",
    "taşıyıcı",
    "taşıyıcı firma",
  ],
  product: ["ürün", "ürün adı", "malzeme", "malzeme adı", "ürün cinsi"],
  status: ["durum", "statü", "kayıt durumu", "araç durumu", "son durum"],
  rejectionReason: [
    "red açıklaması",
    "red açıklama",
    "red nedeni",
    "red sebebi",
    "ret nedeni",
    "ret sebebi",
    "kök sebep",
    "red kök sebebi",
  ],
  customer: ["müşteri", "müşteri adı", "operasyon", "cari", "cari adı"],
};
