# Terminal İlk 20 Web Uygulaması Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcının tek bir ham `.xlsx` Araç Kayıt Sorgu dosyası yükleyerek yalnızca `Poliport Terminal` kayıtlarından tarayıcı önizlemesi ve mevcut tasarımla uyumlu 23 sayfalık indirilebilir İlk 20 Nakliyeci raporu üretmesini sağlamak.

**Architecture:** Vinext/React tabanlı tek sayfalı uygulama dosyayı yalnızca tarayıcı belleğinde okuyacak. Excel içe aktarma, normalleştirme, durum/kök-sebep sınıflandırması ve rapor hesaplama saf TypeScript modülleri olarak ayrılacak; önizleme ile Excel üreticisi aynı değişmez `ReportModel` nesnesini kullanacak. ExcelJS, verisiz bir şablonu tarayıcıda dolduracak; ham veri sunucuya gönderilmeyecek.

**Tech Stack:** Vinext 1 / React 19 / TypeScript 5.9 / Tailwind CSS 4 / ExcelJS / Vitest / Testing Library / Sites private hosting / GitHub Actions

**Spec:** [Onaylanan tasarım belgesi](../specs/2026-10-11-terminal-ilk20-web-app-design.md)

## Global Constraints

- Gerçek ham dosya, mevcut gerçek rapor, gerçek nakliyeci adları veya üretilmiş gerçek rapor GitHub'a eklenmeyecek.
- İlk sürüm yalnızca `.xlsx` kabul edecek; `.xls`, şifreli ve bozuk dosyalar anlaşılır bir hata ile durdurulacak.
- Departman filtresi bütün tarih/KPI/sıralama/red/kök-sebep hesaplarından **önce** uygulanacak. Yalnızca normalize edilmiş `Poliport Terminal` değeri dahil edilecek.
- Önizleme ve Excel ayrı hesaplama yapmayacak; her ikisi de aynı `ReportModel` örneğini okuyacak.
- Tanınmayan boş olmayan durumlar kullanıcı `Red`, `Red değil` veya `Hariç` seçmeden rapor üretimini engelleyecek.
- Her ham satır bir araç kaydı sayılacak; otomatik tekilleştirme yapılmayacak.
- Çıktı her zaman 23 görünür sayfa içerecek: 3 genel sayfa + 20 detay sayfası.
- İlk 20'den az nakliyeci varsa boş detay sayfaları `Bu dönem için veri yok` mesajıyla korunacak.
- Excel dosya adı `Terminal_Ilk20_DD.MM.YYYY_DD.MM.YYYY.xlsx` olacak.
- Arayüz ve kullanıcıya gösterilen hata/uyarı metinleri Türkçe olacak.
- Uygulama erişilebilir klavye akışına, görünür odak durumuna ve yeterli renk kontrastına sahip olacak.
- GitHub deposu ve Sites dağıtımı özel erişimli olacak.

## Review Focus

Uygulama son incelemesinde özellikle aşağıdaki hata sınıfları aranacak:

1. **Departman sızıntısı:** Başka departmanların tarih aralığına, ilk 20'ye veya red toplamına karışması. `department-filter.test.ts` ve uçtan uca karışık departman senaryosu bunu kapatacak.
2. **Excel tarih/saat bozulması:** Excel seri tarihi, gerçek `Date`, Türkçe metin tarihi ve ayrı saat sütununun farklı sonuç vermesi. `date-time.test.ts` bütün kodlama biçimlerini aynı zamana bağlayacak.
3. **Bilinmeyen durumun sessiz sınıflanması:** Yeni bir durum değerinin yanlışlıkla red/red-değil sayılması. `status-classifier.test.ts` ve arayüz testi üretim düğmesini bloke edecek.
4. **Sayfa adı çakışması/sınırı:** Uzun veya benzer nakliyeci adlarının 31 karakter sınırında aynı ada dönüşmesi. `sheet-names.test.ts` benzersiz ve deterministik adları doğrulayacak.
5. **Kök sebep kaybı/çifte sayım:** Çoklu veya sözlüğe uymayan açıklamaların kaybolması. `root-causes.test.ts` ayrıştırma, eşleştirme ve özgün metin korumasını doğrulayacak.
6. **Büyük dosyada donma/taşma:** 50.000 sentetik satırın sonuç mutabakatını ve kabul edilebilir sürede işlenmesini `large-workbook.test.ts` izleyecek; arayüz işlem durumunu gösterecek.

---

## Target File Map

Uygulama deposu şu klasörde kurulacak:

`/Users/seymen/Documents/Codex/2026-10-09/bir-x20/terminal-ilk20-rapor`

```text
terminal-ilk20-rapor/
  app/
    globals.css
    layout.tsx
    page.tsx
  src/
    analysis/
      build-report.ts
      department-filter.ts
      header-mapping.ts
      normalize-records.ts
      root-causes.ts
      status-classifier.ts
    components/
      column-mapper.tsx
      file-upload-card.tsx
      preview/
        carrier-detail.tsx
        management-summary.tsx
        report-preview.tsx
        root-cause-summary.tsx
      status-mapper.tsx
      validation-summary.tsx
      warnings-panel.tsx
    config/
      column-aliases.ts
      report-layout.ts
      root-cause-rules.ts
      status-rules.ts
    excel/
      build-file-name.ts
      read-workbook.ts
      sheet-names.ts
      write-report.ts
    types/
      import.ts
      report.ts
    utils/
      date-time.ts
      text.ts
  public/
    templates/
      terminal-ilk20-template.xlsx
  tests/
    fixtures/
      synthetic-data.ts
      synthetic-workbook.ts
    integration/
      import-to-report.test.ts
      large-workbook.test.ts
      report-workbook.test.ts
    ui/
      app-flow.test.tsx
    unit/
      build-report.test.ts
      date-time.test.ts
      department-filter.test.ts
      header-mapping.test.ts
      root-causes.test.ts
      sheet-names.test.ts
      status-classifier.test.ts
    setup.ts
  docs/superpowers/
    specs/2026-10-11-terminal-ilk20-web-app-design.md
    plans/2026-10-11-terminal-ilk20-web-app.md
  .github/workflows/ci.yml
  .gitignore
  README.md
  package.json
  vitest.config.ts
```

Temel veri sözleşmeleri:

```ts
export type SemanticField =
  | "date"
  | "time"
  | "department"
  | "carrier"
  | "product"
  | "status"
  | "rejectionReason"
  | "customer";

export interface ColumnMapping {
  date: number;
  time?: number;
  department: number;
  carrier: number;
  product: number;
  status: number;
  rejectionReason: number;
  customer?: number;
}

export interface NormalizedRecord {
  sourceRow: number;
  occurredAt: Date;
  hour: number;
  department: string;
  carrier: string;
  product: string;
  status: string;
  rejectionReason: string;
  customer?: string;
}

export type StatusDisposition = "red" | "not-red" | "exclude";

export interface ReportModel {
  period: { start: Date; end: Date };
  totals: ReportTotals;
  topCarriers: CarrierReport[];
  rootCauses: RootCauseTotal[];
  hourlyTotals: number[];
  importSummary: ImportSummary;
  warnings: ReportWarning[];
}
```

Ana fonksiyon sınırları:

```ts
readWorkbook(buffer: ArrayBuffer): Promise<WorkbookCandidate>
suggestColumnMapping(headers: string[]): Partial<ColumnMapping>
normalizeRecords(rows: unknown[][], mapping: ColumnMapping): NormalizationResult
filterPoliportTerminal(records: NormalizedRecord[]): DepartmentFilterResult
classifyRecord(record: NormalizedRecord, rules: StatusRuleMap): StatusDisposition
splitAndNormalizeRootCauses(value: string): RootCauseMatch[]
buildReportModel(input: BuildReportInput): ReportModel
buildReportWorkbook(model: ReportModel): Promise<Uint8Array>
buildReportFileName(period: ReportModel["period"]): string
```

---

## Task 1: Depoyu ve test temelini kur

**Files:**

- Create: `terminal-ilk20-rapor/` (Sites Vinext starter ile)
- Modify: `terminal-ilk20-rapor/package.json`
- Create: `terminal-ilk20-rapor/vitest.config.ts`
- Create: `terminal-ilk20-rapor/tests/setup.ts`
- Modify: `terminal-ilk20-rapor/.gitignore`
- Copy: `docs/superpowers/specs/2026-10-11-terminal-ilk20-web-app-design.md` → `terminal-ilk20-rapor/docs/superpowers/specs/...`
- Copy: bu plan → `terminal-ilk20-rapor/docs/superpowers/plans/...`

- [ ] **Step 1: Boş proje klasörünü oluştur ve resmi Sites kurulum yardımcısıyla Vinext başlangıcını kur**

  Başlangıçtan önce hedef klasörün boş olduğunu doğrula. Sites `project-setup.mjs` aracını `/Users/seymen/Documents/Codex/2026-10-09/bir-x20/terminal-ilk20-rapor` içinde çalıştır; bağımlılık kurulumunu Sites yardımcısıyla tamamla.

- [ ] **Step 2: Uygulama ve test bağımlılıklarını ekle**

  Çalışma bağımlılığı olarak `exceljs`; geliştirme bağımlılığı olarak `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` ekle. `package.json` komutları:

  ```json
  {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
  ```

- [ ] **Step 3: Test koşucusunun ilk başarısız kontrolünü yaz**

  `tests/setup.ts` içinde `@testing-library/jest-dom/vitest` kurulumunu yap. `vitest.config.ts` içinde `jsdom`, `@/` yolu ve setup dosyasını tanımla. Geçici bir smoke testi `expect(document).toBeDefined()` ile oluştur.

- [ ] **Step 4: Testi çalıştır ve eksik yapılandırma nedeniyle başarısız olduğunu doğrula**

  Run: `npm test -- --run tests/smoke.test.ts`

  Expected: Vitest yapılandırması veya eksik bağımlılık nedeniyle FAIL.

- [ ] **Step 5: Yapılandırmayı tamamla ve smoke testini geçir**

  Run: `npm test -- --run tests/smoke.test.ts`

  Expected: 1 test PASS.

- [ ] **Step 6: Gerçek veri sızıntısını engelleyen ignore kurallarını ekle**

  `.gitignore` içine en az `*.xls`, yükleme/çıktı klasörleri, `Terminal_Ilk20_*.xlsx`, `.env*`, yerel önizleme ve geçici dosya kalıplarını ekle; yalnızca `public/templates/terminal-ilk20-template.xlsx` için açık istisna kullan.

- [ ] **Step 7: Tasarım ve planı depo içine kopyala, özel Git deposunu başlat**

  `git init -b main` çalıştır. `git status --short` ile yalnızca başlangıç kodu, dokümanlar ve yapılandırmanın yer aldığını doğrula.

- [ ] **Step 8: Temel kalite kontrollerini çalıştır**

  Run: `npm run typecheck && npm run lint && npm test && npm run build`

  Expected: bütün komutlar exit 0.

- [ ] **Step 9: Başlangıç commitini oluştur**

  ```bash
  git add .
  git commit -m "chore: scaffold terminal report app"
  ```

---

## Task 2: Metin, tarih-saat ve departman normalleştirmesini uygula

**Files:**

- Create: `src/types/import.ts`
- Create: `src/utils/text.ts`
- Create: `src/utils/date-time.ts`
- Create: `src/analysis/department-filter.ts`
- Create: `tests/unit/date-time.test.ts`
- Create: `tests/unit/department-filter.test.ts`

- [ ] **Step 1: Türkçe metin ve departman filtresi için başarısız testleri yaz**

  Aşağıdaki değerlerin dahil edildiğini doğrula:

  ```ts
  ["Poliport Terminal", " poliport terminal ", "POLİPORT TERMİNAL"]
  ```

  `Poliport Liman`, `Poliport Tank`, boş değer ve başka departmanların hariç tutulduğunu; `rowsRead`, `rowsIncluded`, `rowsExcludedDepartment` sayılarının ayrı döndüğünü doğrula.

- [ ] **Step 2: Departman testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/department-filter.test.ts`

  Expected: modüller henüz olmadığı için FAIL.

- [ ] **Step 3: Güvenli metin normalleştirme ve departman filtresini uygula**

  `normalizeForComparison` yalnızca karşılaştırma için boşluk/kase/Türkçe karakter farklarını giderecek; gösterilecek nakliyeci ve ürün adını değiştirmeyecek. `filterPoliportTerminal` filtre sonucuyla birlikte sayım özetini döndürecek.

- [ ] **Step 4: Excel tarih/saat biçimleri için başarısız testleri yaz**

  Testler şunları kapsasın:

  - Excel seri tarihi.
  - JavaScript `Date`.
  - `DD.MM.YYYY` ve `DD/MM/YYYY` metni.
  - Tek tarih-saat sütunu.
  - Ayrı `HH:mm` metin veya Excel saat kesri.
  - Geçersiz tarih ve 24:00 dışı saat.

- [ ] **Step 5: Tarih testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/date-time.test.ts`

  Expected: tarih yardımcıları eksik olduğundan FAIL.

- [ ] **Step 6: Tarih-saat dönüştürücülerini uygula**

  Saat dilimi kaymasına yol açmayacak şekilde yerel takvim bileşenleriyle `Date` üret. Saat grubu her zaman `0..23` tamsayısı olsun; geçersiz değer nedenli uyarı üretilebilsin.

- [ ] **Step 7: Birim testleri ve tip kontrolünü geçir**

  Run: `npm test -- --run tests/unit/date-time.test.ts tests/unit/department-filter.test.ts && npm run typecheck`

  Expected: PASS, exit 0.

- [ ] **Step 8: Commit oluştur**

  ```bash
  git add src tests
  git commit -m "feat: normalize dates and Poliport department records"
  ```

---

## Task 3: Excel içe aktarma ve sütun eşleştirmesini kur

**Files:**

- Create: `src/config/column-aliases.ts`
- Create: `src/analysis/header-mapping.ts`
- Create: `src/analysis/normalize-records.ts`
- Create: `src/excel/read-workbook.ts`
- Create: `tests/fixtures/synthetic-data.ts`
- Create: `tests/fixtures/synthetic-workbook.ts`
- Create: `tests/unit/header-mapping.test.ts`
- Create: `tests/integration/import-to-report.test.ts`

- [ ] **Step 1: Sentetik çalışma kitabı üreticisini tanımla**

  Yardımcı, gerçek şirket veya kişi adı kullanmadan bellek içinde `.xlsx` bytes üretsin. Farklı sayfa adları, başlık satırından önce açıklama satırları, tek/bölünmüş tarih-saat ve üç departman seçeneği desteklesin.

- [ ] **Step 2: Başlık bulma ve otomatik eşleştirme için başarısız testleri yaz**

  `Nakliyeci`, `Nakliyeci Adı`, `Firma`, `Taşıyıcı`; `Departman`, `Tesis`; `Red Açıklaması`, `Kök Sebep` eş anlamlılarını doğrula. Düşük güvenli veya çakışan eşleşmenin `requiresUserMapping: true` üretmesini bekle.

- [ ] **Step 3: Testi çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/header-mapping.test.ts`

  Expected: eşleştirme kodu olmadığı için FAIL.

- [ ] **Step 4: Başlık puanlama ve eşleştirme motorunu uygula**

  `suggestColumnMapping(headers)` her zorunlu alan için en iyi adayı, güven puanını ve çakışma bilgisini döndürsün. Aynı sütun iki zorunlu alana sessizce atanmasın.

- [ ] **Step 5: Excel okuyucu entegrasyon testini yaz**

  Test; doğru veri sayfasını/başlık satırını bulmayı, ilk sayfanın boş olmasını, `.xls` reddini ve bozuk `.xlsx` hatasını kapsasın. Gerçek dosya kullanma.

- [ ] **Step 6: Entegrasyon testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/integration/import-to-report.test.ts`

  Expected: okuyucu/normalleştirme uygulanmadığı için FAIL.

- [ ] **Step 7: Tarayıcı uyumlu çalışma kitabı okuyucusunu uygula**

  ExcelJS'i istemci tarafında dinamik yükle. Çalışma sayfalarını satır yoğunluğuna ve zorunlu başlık adaylarına göre puanla. Çıktı yalnızca ham değer dizilerini, başlıkları ve eşleştirme adaylarını içersin; sunucu çağrısı yapmasın.

- [ ] **Step 8: Satır normalleştirme ve uyarı modelini uygula**

  Eksik nakliyeci/geçersiz tarih satırlarını `invalidRows` listesine ekle; ürün/saat/durum/açıklama boşluklarını engellemeyen uyarı olarak sakla. Departman filtresi tarih aralığından önce çalışsın. Poliport satırı kalmazsa bloklayıcı hata dönsün.

- [ ] **Step 9: İçe aktarma testlerini geçir**

  Run: `npm test -- --run tests/unit/header-mapping.test.ts tests/integration/import-to-report.test.ts && npm run typecheck`

  Expected: PASS.

- [ ] **Step 10: Commit oluştur**

  ```bash
  git add src tests
  git commit -m "feat: import workbooks and map report columns"
  ```

---

## Task 4: Durum ve kök sebep sınıflandırmasını uygula

**Files:**

- Create: `src/config/status-rules.ts`
- Create: `src/config/root-cause-rules.ts`
- Create: `src/analysis/status-classifier.ts`
- Create: `src/analysis/root-causes.ts`
- Create: `tests/unit/status-classifier.test.ts`
- Create: `tests/unit/root-causes.test.ts`

- [ ] **Step 1: Durum sınıflandırması için başarısız testleri yaz**

  Aşağıdakileri doğrula:

  - `Red` → `red`.
  - `Pregate`, `sırada`, `beklemede` ve yazım/kase çeşitleri → `exclude` veya geçerli red dışı.
  - Boş durum + dolu red açıklaması → `red` adayı.
  - Boş durum + boş açıklama → `not-red`.
  - Tanınmayan boş olmayan durum → `unresolvedStatuses` listesi ve üretim engeli.
  - Kullanıcı kuralı varsayılan davranışı kontrollü biçimde geçersiz kılar.

- [ ] **Step 2: Durum testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/status-classifier.test.ts`

  Expected: FAIL.

- [ ] **Step 3: Varsayılan durum sözlüğünü ve sınıflandırıcıyı uygula**

  Kuralları veri yapısı olarak tut; hesaplama koduna sabit metin gömme. `collectUnknownStatuses(records, rules)` benzersiz özgün değerleri ve satır sayılarını döndürsün.

- [ ] **Step 4: Kök sebep için başarısız testleri yaz**

  Testler noktalı virgül, satır sonu, madde işareti ve güvenli ayırıcılarla çoklu sebebi ayırsın. Standart kuralla eşleşen açıklama standart başlığı, eşleşmeyen açıklama özgün kırpılmış metni korusun. Aynı hücrede iki farklı sebep ayrı sayılsın.

- [ ] **Step 5: Kök sebep testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/root-causes.test.ts`

  Expected: FAIL.

- [ ] **Step 6: Sıralı kök sebep kurallarını uygula**

  Her kural `id`, `label`, `patterns` içersin. İlk eşleşen standart başlık kullanılsın. Eşleşmeyenler `matched: false` olarak özgün metinle döndürülsün; boş açıklama sebep üretmesin.

- [ ] **Step 7: İnceleme odağı testlerini geçir**

  Run: `npm test -- --run tests/unit/status-classifier.test.ts tests/unit/root-causes.test.ts && npm run typecheck`

  Expected: PASS.

- [ ] **Step 8: Commit oluştur**

  ```bash
  git add src tests
  git commit -m "feat: classify rejection statuses and root causes"
  ```

---

## Task 5: Tek kaynaklı rapor modelini hesapla

**Files:**

- Create: `src/types/report.ts`
- Create: `src/analysis/build-report.ts`
- Create: `tests/unit/build-report.test.ts`
- Extend: `tests/integration/import-to-report.test.ts`

- [ ] **Step 1: `ReportModel` ve alt tiplerini tanımla**

  `ReportTotals`, `CarrierReport`, `ProductTotal`, `RootCauseTotal`, `ImportSummary`, `ReportWarning`, `BuildReportInput` alanlarını kesin tiplerle oluştur. `hourlyTotals` daima 24 elemanlı olsun.

- [ ] **Step 2: Hesaplama motoru için başarısız testleri yaz**

  Sentetik veriyle şunları doğrula:

  - Toplam satır, geçerli red ve red oranı.
  - Benzersiz nakliyeci.
  - Kayıt sayısına göre azalan ilk 20; eşitlikte Türkçe uyumlu alfabetik sıra.
  - Aktif gün ve bir ondalıklı günlük ortalama.
  - Ürün toplamı/red oranı.
  - 24 saat toplamı ve en yoğun saatte deterministik eşitlik kuralı.
  - Genel/nakliyeci kök sebepleri.
  - En çok alınan ürün.
  - Alışan varsa Ravago/Strene ve diğerleri ayrımı.
  - 20'den az nakliyeci durumu.

- [ ] **Step 3: Testi çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/build-report.test.ts`

  Expected: rapor motoru olmadığı için FAIL.

- [ ] **Step 4: Saf rapor hesaplama motorunu uygula**

  `buildReportModel` girdi dizisini değiştirmesin. Bütün oranlarda payda sıfırını açıkça ele al; sayı biçimlendirmesini UI/Excel katmanına bırak. Sıralamalar deterministik olsun.

- [ ] **Step 5: Departman sızıntısı entegrasyon senaryosunu ekle**

  Başka departmandaki daha eski/yeni tarih, çok yüksek kayıtlı nakliyeci ve çok sayıda red; sonuçtaki dönem, ilk 20 ve red toplamını etkilememeli.

- [ ] **Step 6: Toplam mutabakat testlerini ekle**

  Aşağıdaki değişmezleri doğrula:

  ```ts
  sum(model.hourlyTotals) === model.totals.registrations
  sum(model.topCarriers.map(x => x.registrations)) <= model.totals.registrations
  sum(carrier.products.map(x => x.registrations)) === carrier.registrations
  ```

- [ ] **Step 7: Birim ve entegrasyon testlerini geçir**

  Run: `npm test -- --run tests/unit/build-report.test.ts tests/integration/import-to-report.test.ts && npm run typecheck`

  Expected: PASS.

- [ ] **Step 8: Commit oluştur**

  ```bash
  git add src tests
  git commit -m "feat: calculate top carrier report model"
  ```

---

## Task 6: Verisiz 23 sayfalık Excel şablonunu ve üreticiyi oluştur

**Files:**

- Create: `public/templates/terminal-ilk20-template.xlsx`
- Create: `src/config/report-layout.ts`
- Create: `src/excel/build-file-name.ts`
- Create: `src/excel/sheet-names.ts`
- Create: `src/excel/write-report.ts`
- Create: `tests/unit/sheet-names.test.ts`
- Create: `tests/integration/report-workbook.test.ts`

- [ ] **Step 1: Excel çıktı sözleşmesi için başarısız testleri yaz**

  Test çalışma kitabını yeniden açarak şunları beklesin:

  - Tam 23 görünür sayfa.
  - İlk üç sayfa sırasıyla `Yönetim Özeti`, `Kök Sebep Analizi`, `Saat Yoğunluk`.
  - 20 detay sayfası.
  - Yönetici özetinde doğru dönem/toplam/red oranı.
  - Detayda ürün, saat ve kök sebep toplamları.
  - Boş slotta `Bu dönem için veri yok`.
  - En az kritik başlıklarda dolgu/yazı tipi/hizalama/sayı biçimi kontrolü.
  - Dosya adında Poliport kayıtlarından gelen başlangıç/bitiş tarihi.

- [ ] **Step 2: Sayfa adı sınırı için başarısız testleri yaz**

  31 karakterden uzun, aynı ilk 31 karaktere sahip ve Excel'de yasak karakter içeren nakliyeci adlarından benzersiz, deterministik sayfa adları bekle. Tam nakliyeci adı hücre başlığında korunmalı.

- [ ] **Step 3: Testleri çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/unit/sheet-names.test.ts tests/integration/report-workbook.test.ts`

  Expected: şablon/yazıcı olmadığı için FAIL.

- [ ] **Step 4: Şablon işini başlatmadan önce elektronik tablo işlem işaretini bir kez çalıştır**

  Spreadsheets becerisinin istediği `mark_artifact_operation_started.mjs` yardımcısını tam bir kez çalıştır. Gerçek raporu depoya kopyalama.

- [ ] **Step 5: Verisiz şablonu oluştur ve görsel olarak doğrula**

  `@oai/artifact-tool` ile mevcut raporun renk, yazı tipi, sütun genişliği, satır yüksekliği, birleşik hücre, kenarlık ve sayı biçimlerini taşıyan; fakat gerçek tarih/rakam/nakliyeci içermeyen 23 sayfalık şablon üret. Genel sayfalar sabit adlarda, detaylar `Detay 01`–`Detay 20` gibi nötr adlarda olsun.

  Şablonu render et ve 23 sayfanın tamamını görsel olarak incele. Taşma, kesilme, formül hatası ve gerçek veri izi olmamalı.

- [ ] **Step 6: Hücre sözleşmesini `report-layout.ts` içinde merkezileştir**

  Dönem, KPI, ilk 20, kök sebep, saat ve detay bölümlerinin başlangıç hücreleri/range'leri tek yapı içinde tanımlansın. `write-report.ts` içine dağınık hücre adresleri gömülmesin.

- [ ] **Step 7: Sayfa adı ve dosya adı yardımcılarını uygula**

  `makeUniqueSheetName(rank, carrier, usedNames)` 31 karakter sınırı ve yasak karakterleri uygulayacak. Çakışmada kısa, deterministik sıra eki kullanacak.

- [ ] **Step 8: Excel üreticiyi uygula**

  Şablonu `/templates/terminal-ilk20-template.xlsx` yolundan yükle; 20 detay slotunu doldur/temizle; sayfaları görünür tut; dönem metni ve değerleri yaz; oran/ondalık/tarih biçimlerini koru. ExcelJS tarayıcı içinde çalışsın ve `Uint8Array` döndürsün.

- [ ] **Step 9: Çıktıyı programatik ve görsel olarak doğrula**

  Run: `npm test -- --run tests/unit/sheet-names.test.ts tests/integration/report-workbook.test.ts`

  Ardından sentetik bir rapor üret, yeniden aç ve 23 sayfayı render ederek şablonla karşılaştır. Expected: testler PASS; hiçbir `#REF!`, `#VALUE!`, kesilmiş başlık veya boş zorunlu bölüm yok.

- [ ] **Step 10: Commit oluştur**

  ```bash
  git add public/templates src tests
  git commit -m "feat: generate styled 23-sheet Excel reports"
  ```

---

## Task 7: Yükleme, eşleştirme, önizleme ve indirme arayüzünü tamamla

**Files:**

- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `src/components/file-upload-card.tsx`
- Create: `src/components/column-mapper.tsx`
- Create: `src/components/status-mapper.tsx`
- Create: `src/components/validation-summary.tsx`
- Create: `src/components/warnings-panel.tsx`
- Create: `src/components/preview/management-summary.tsx`
- Create: `src/components/preview/root-cause-summary.tsx`
- Create: `src/components/preview/carrier-detail.tsx`
- Create: `src/components/preview/report-preview.tsx`
- Create: `tests/ui/app-flow.test.tsx`

- [ ] **Step 1: Ana kullanıcı akışı için başarısız UI testini yaz**

  Test sentetik `.xlsx` yükleyip şunları gözlesin:

  - `.xlsx` dışı dosya reddi.
  - Dosya adı ve gizlilik açıklaması.
  - Toplam/Poliport/dışlanan satır sayıları.
  - Eksik sütunda eşleştirme alanı.
  - Bilinmeyen durumda bloklanan `Raporu Hazırla`.
  - Kullanıcı sınıflandırmasından sonra önizleme.
  - İlk 20 ve detay seçimi.
  - `Excel Raporunu İndir` düğmesinin doğru dosya adıyla Blob üretmesi.
  - `Yeni Dosya Yükle` ile önceki modelin temizlenmesi.

- [ ] **Step 2: UI testini çalıştır ve FAIL gör**

  Run: `npm test -- --run tests/ui/app-flow.test.tsx`

  Expected: bileşenler olmadığı için FAIL.

- [ ] **Step 3: Sayfa durum makinesini uygula**

  Durumlar: `idle → reading → mapping → status-review → ready → generating → preview`, ayrıca `error`. Yeni dosya seçimi önceki `ArrayBuffer`, kayıtlar, eşleştirme ve rapor modelini serbest bıraksın.

- [ ] **Step 4: Yükleme ve doğrulama kartlarını uygula**

  Dosya seçici klavye ve ekran okuyucu ile kullanılabilir olsun. İşlem sırasında satır/iş aşaması metni göster. Eşleştirme seçimleri yalnızca gerekli olduğunda açılsın; zorunlu alanlar tam olmadan devam etmesin.

- [ ] **Step 5: Durum sınıflandırma arayüzünü uygula**

  Her tanınmayan durum için örnek satır sayısı ve `Red / Red değil / Hariç` seçimi göster. Bütünleri seçilmeden üretim düğmesini kapalı tut ve nedenini metinle bildir.

- [ ] **Step 6: Tek `ReportModel` kullanan önizlemeyi uygula**

  Yönetim kartları, ilk 20 tablosu, kök sebepler, saat yoğunluğu ve seçili nakliyeci detaylarını aynı nesneden oku. Grafikleri erişilebilir tablo/etiketlerle destekle. Mobilde geniş tablolar kontrollü yatay kaydırılsın.

- [ ] **Step 7: Excel indirmeyi uygula**

  `buildReportWorkbook(model)` sonucunu Blob URL ile indir. İndirme tamamlanınca URL'yi iptal et. Excel üretimi başarısızsa yarım dosya sunma ve kullanıcıya Türkçe hata göster.

- [ ] **Step 8: UI ve erişilebilirlik testlerini geçir**

  Run: `npm test -- --run tests/ui/app-flow.test.tsx && npm run typecheck && npm run lint`

  Expected: PASS.

- [ ] **Step 9: Yerel tarayıcı önizlemesini aç ve görsel QA yap**

  Sites yerel önizleme talimatlarını izleyerek uygulamayı aç. Masaüstü ve dar ekranlarda yükleme, eşleştirme, uyarı, önizleme ve indirme durumlarını kontrol et. Tarayıcı konsolunda hata olmamalı.

- [ ] **Step 10: Commit oluştur**

  ```bash
  git add app src tests
  git commit -m "feat: add private browser report workflow"
  ```

---

## Task 8: Dayanıklılık, büyük dosya ve bütünleşik doğrulamayı tamamla

**Files:**

- Create: `tests/integration/large-workbook.test.ts`
- Extend: `tests/integration/import-to-report.test.ts`
- Extend: `tests/integration/report-workbook.test.ts`
- Extend: `tests/ui/app-flow.test.tsx`

- [ ] **Step 1: 50.000 satırlık başarısız dayanıklılık testini yaz**

  Sentetik üretici karışık üç departman, en az 30 nakliyeci, çoklu ay, bilinmeyen durumlar ve çoklu sebepler üretsin. Test kesin sonuç toplamlarını doğrulasın; gevşek ama kaydedilen bir süre eşiğiyle performans gerilemesini yakalasın.

- [ ] **Step 2: Testi çalıştır ve darboğazı ölç**

  Run: `npm test -- --run tests/integration/large-workbook.test.ts`

  Expected: ilk çalıştırmada süre/memory veya henüz eklenmemiş ilerleme yolu nedeniyle FAIL ya da açık ölçüm çıktısı.

- [ ] **Step 3: Gerekirse tek geçişli toplama ve olay döngüsüne nefes verme ekle**

  Yinelenen filtre/group çağrılarını tek geçişli `Map` toplamalarına dönüştür. Okuma/hesaplama adımları arasında UI ilerleme güncellemesine izin ver; sonuçları değiştirme.

- [ ] **Step 4: Hata senaryolarını tamamla**

  Bozuk, şifreli, veri sayfasız, zorunlu alan eksik, Poliport satırı olmayan ve geçerli satırı kalmayan dosyaların indirme üretmediğini doğrula.

- [ ] **Step 5: Kritik değişmezler ve dosya gizliliğini doğrula**

  Kodda `fetch` yalnızca statik şablon için kullanılmalı; ham `File`/`ArrayBuffer` hiçbir API rotasına gönderilmemeli. `rg` ile gerçek kaynak dosya adı, bilinen gerçek nakliyeci adları ve kişisel/veri örnekleri aranıp sonuç sıfır olmalı.

- [ ] **Step 6: Tam otomatik doğrulamayı çalıştır**

  Run: `npm run typecheck && npm run lint && npm test && npm run build`

  Expected: tüm komutlar exit 0; başarısız/atlanan test yok.

- [ ] **Step 7: Sentetik dosyayla tam manuel kabul akışını tamamla**

  Yükle → otomatik eşleştir → bilinmeyen durumları sınıflandır → rapor oluştur → önizleme toplamlarını kaydet → Excel indir → Excel'i yeniden aç/render et → önizleme toplamlarıyla 23 sayfayı karşılaştır.

- [ ] **Step 8: Commit oluştur**

  ```bash
  git add src tests app
  git commit -m "test: harden large workbook report generation"
  ```

---

## Task 9: README, CI, özel GitHub deposu ve özel Sites yayını

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `README.md`
- Verify: `.openai/hosting.json`

- [ ] **Step 1: CI iş akışını önce başarısız doğrulamayla ekle**

  GitHub Actions Node sürümünü starter gereksinimine uygun seçsin; temiz kurulumdan sonra `typecheck`, `lint`, `test`, `build` çalıştırsın. Yerelde workflow komut dizisini çalıştırarak eksikleri gör.

- [ ] **Step 2: README'yi tamamla**

  Türkçe kullanıcı ve geliştirici bölümleri içersin:

  - Amaç ve yalnızca Poliport Terminal kapsamı.
  - Ham verinin tarayıcı dışına çıkmadığı gizlilik modeli.
  - Kabul edilen dosya ve gerekli sütunlar.
  - Kurulum/çalıştırma/test/build komutları.
  - Durum eşleştirme ve hata çözme.
  - 23 sayfalık çıktı ve dosya adı.
  - Gerçek verinin depoya eklenmemesi uyarısı.

- [ ] **Step 3: Son depo denetimini yap**

  Run: `git status --short && git ls-files | sort`

  Expected: çalışma ağacı temiz; hiçbir gerçek `.xlsx` yok; yalnızca verisiz şablon ve sentetik test üreticileri var.

- [ ] **Step 4: Tam doğrulamayı son kez çalıştır**

  Run: `npm run typecheck && npm run lint && npm test && npm run build`

  Expected: exit 0.

- [ ] **Step 5: Dokümantasyon ve CI commitini oluştur**

  ```bash
  git add README.md .github .openai
  git commit -m "docs: add usage guide and continuous integration"
  ```

- [ ] **Step 6: Özel GitHub deposunu oluştur ve gönder**

  Yetkili GitHub oturumuyla `terminal-ilk20-rapor` adlı **private** depo oluştur. Yerel depoya `origin` ekle ve `main` dalını gönder. Uzak depo dosya listesini ve CI çalışmasını kontrol et. GitHub kimlik bilgilerini dosyaya veya komut çıktısına yazma.

- [ ] **Step 7: Sites projesini özel olarak kaydet ve yayımla**

  `sites:sites` becerisinin register/publish akışını kullan. İlk yayın özel erişimli olsun. Yayın öncesi üretim build'ini ve manifesti doğrula; veritabanı/R2 bağlantısı ekleme.

- [ ] **Step 8: Yayın sonrası kabul testi yap**

  Özel bağlantıyı aç; sentetik dosyayla yükleme, önizleme ve indirme akışını çalıştır. Ağ kayıtlarında ham çalışma kitabının sunucuya gönderilmediğini doğrula. İndirilen Excel'i yeniden açarak 23 sayfayı kontrol et.

- [ ] **Step 9: Teslim bilgilerini hazırla**

  Kullanıcıya özel GitHub depo bağlantısı, özel uygulama bağlantısı, doğrulama sonuçları ve kısa kullanım adımlarını ver. Gerçek ham dosyanın hiçbir yere yüklenmediğini açıkça belirt.

---

## Final Verification Checklist

- [ ] Onaylanan tasarım belgesindeki 12 kabul kriterinin her biri bir otomatik veya manuel doğrulamayla eşleştirildi.
- [ ] Yalnızca Poliport Terminal kayıtları tarih aralığına ve bütün analizlere giriyor.
- [ ] Önizleme ve Excel aynı `ReportModel` değerlerini kullanıyor.
- [ ] Tanınmayan durumlar kullanıcı kararı olmadan rapora girmiyor.
- [ ] Excel 23 görünür sayfa, doğru sıra ve temel biçimleri koruyor.
- [ ] İlk 20'den az nakliyeci ve uzun/çakışan sayfa adları doğru işleniyor.
- [ ] Çoklu/eşleşmeyen kök sebepler kaybolmuyor.
- [ ] 50.000 satırlık sentetik dosya akışı tamamlanıyor.
- [ ] Gerçek iş verisi Git deposunda veya dağıtım varlıklarında yok.
- [ ] `typecheck`, `lint`, `test`, `build` son çalıştırmada başarılı.
- [ ] GitHub deposu private ve `main` güncel.
- [ ] Sites yayını private ve indirilen dosya yeniden açılabiliyor.
