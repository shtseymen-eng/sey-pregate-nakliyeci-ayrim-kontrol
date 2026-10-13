export interface RootCauseRule {
  id: string;
  label: string;
  patterns: string[];
}

export const ROOT_CAUSE_RULES: RootCauseRule[] = [
  {
    id: "health-report",
    label: "Yüksekte çalışabilir sağlık raporu eksik",
    patterns: ["saglik raporu", "saglk raporu", "yuksekte calisabilir"],
  },
  {
    id: "company-cancellation",
    label: "Firma talebi / iptal",
    patterns: [
      "mesai",
      "firma iptal",
      "firma geri cek",
      "firma talep",
      "firma taleb",
      "tedarikci iptal",
      "yukleme iptal",
      "nakliyeci iptal",
      "nakliyeci talep",
      "nakliyeci taleb",
      "ertelendi",
      "erteledi",
      "yanlis tesis",
      "farkli tesis",
      "yanlis departman",
      "hatali kayit",
      "mukerrer",
      "surucu beyan",
      "surucu istek",
      "surucu talep",
      "surucu taleb",
      "sofor beyan",
      "sofor istek",
      "sofor talep",
      "sofor taleb",
      "kayit sil",
      "kaydini sil",
      "sildirdi",
      "yarin",
    ],
  },
  {
    id: "responsibility-document",
    label: "Sorumluluk evrakı/yazısı eksik",
    patterns: ["sorumluluk", "sorumlulk", "sorumluluk yazisi"],
  },
  {
    id: "driver-left",
    label: "Sürücü kart almadan ayrıldı veya tesisten çıktı",
    patterns: [
      "surucu tesisten ayr",
      "sofor tesisten ayr",
      "surucu sahadan ayr",
      "kart almadan ayr",
      "surucu cikis yapti",
      "surucu gitti",
    ],
  },
  {
    id: "tractor-adr",
    label: "Çekici ADR/T9 evrakı eksik",
    patterns: ["cekici adr", "cekici t9", "t9 asli"],
  },
  {
    id: "trailer-adr",
    label: "Dorse ADR/T9 evrakı eksik",
    patterns: ["dorse adr", "dorse t9"],
  },
  {
    id: "driver-src5",
    label: "Sürücü SRC5 belgesi eksik",
    patterns: ["src5", "src 5"],
  },
  {
    id: "customs-document",
    label: "Gümrük evrakı eksik",
    patterns: ["gumruk evraki", "beyanname", "ek sure yazisi"],
  },
  {
    id: "technical",
    label: "Araç teknik uygunsuzluğu / arıza",
    patterns: ["arac calism", "lastigi", "lastik", "fari kirik", "cam patla", "teknik uygunsuz", "ariza"],
  },
  {
    id: "inspection",
    label: "Fenni muayene eksik",
    patterns: ["fenni muayene", "fenni mauyene", "fenni mayene"],
  },
  {
    id: "traffic-insurance",
    label: "Trafik sigortası eksik",
    patterns: ["trafik sigorta", "trefik sigorta"],
  },
  {
    id: "ppe",
    label: "KKD eksik",
    patterns: ["kkd", "is guvenligi ayakkabisi", "parasut kemeri", "emniyet kemeri"],
  },
  {
    id: "order-approval",
    label: "Talimat / sipariş onayı yok",
    patterns: ["talimat", "siparis onayi", "siparis no", "talep yok"],
  },
  {
    id: "leak-report",
    label: "Sızdırmazlık raporu eksik",
    patterns: ["sizdirmazlik"],
  },
  {
    id: "tank-pressure",
    label: "Tank basınç raporu eksik",
    patterns: ["tank basinc"],
  },
  {
    id: "hazmat-insurance",
    label: "Tehlikeli madde sigortası eksik",
    patterns: ["tehlikeli madde sigorta", "tehlikeli atik sigorta"],
  },
  {
    id: "un-label",
    label: "UN tabela/etiket eksik veya yanlış",
    patterns: ["un tabela", "un numarasi", "turuncu levha", "tehlike ikaz", "ikaz levhasi"],
  },
  {
    id: "activity-certificate",
    label: "Tehlikeli madde faaliyet belgesi eksik",
    patterns: ["faaliyet belgesi", "isopa"],
  },
  {
    id: "vehicle-card",
    label: "Taşıt kartı eksik",
    patterns: ["tasit karti", "k1 tasit"],
  },
  {
    id: "generic-cancellation",
    label: "Genel iptal / açıklaması belirsiz",
    patterns: ["kayit iptali", "iptal", "diger", "test", "deneme kaydi"],
  },
];
