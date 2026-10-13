# Excel Grafik ve Oran Görünümü Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Üretilen rapora sabit yüzde ölçekli kırmızı veri çubukları, toplam ve nakliyeci bazında saatlik kayıt sütun grafikleri ve yakın konumlu kök sebep bölümü eklemek.

**Architecture:** Mevcut ExcelJS rapor yazımı hücre verilerini ve düzeni üretmeye devam eder. Koşullu biçimlendirme ExcelJS üzerinden yazılır; düzenlenebilir grafikler, ExcelJS çıktısına kaynak hücreleri referanslayan OOXML parçaları ekleyen ayrı bir son işlem modülünde oluşturulur.

**Tech Stack:** TypeScript, ExcelJS, JSZip, Vitest, Vite

**Spec:** `docs/superpowers/specs/2026-10-13-excel-grafik-duzeni-design.md`

## Global Constraints

- Yüzde çubuğu yüzde 0–100 sabit ölçeğinde çalışır; yüzde 50 yarım doluluk gösterir.
- Hücre zemini beyaz, çubuk kırmızı gradyanlı ve yüzde değeri görünürdür.
- Grafikler 00:00–23:00 kaynak hücrelerine bağlı, düzenlenebilir Excel sütun grafikleridir.
- Kök sebepler ilk görünüm alanına yakın olur ve uzun ürün listesiyle çakışmaz.
- Mevcut rapor hesaplamaları ve Poliport Terminal filtresi değişmez.

## Review Focus

- Yüzde 0, yüzde 50 ve yüzde 100 değerlerinde veri çubuğu eşikleri ve görünür değer doğru kalmalı.
- Boş detay yuvalarında grafik veya eski kök sebep içeriği kalmamalı.
- Türkçe ve Excel için özel karakter içeren sayfa adları grafik formüllerinde doğru kaçırılmalı.
- Yirmi dolu nakliyeci olduğunda toplam grafik sayısı 21 olmalı ve her grafik doğru sayfaya bağlanmalı.
- Ürün listesi 100 satırı aşsa bile kök sebepler sağ blokta sabit kalmalı ve ürün tablosu korunmalı.

---

### Task 1: Kırmızı Yüzde Veri Çubukları

**Files:**
- Modify: `src/excel/write-report.ts`
- Test: `tests/integration/report-workbook.test.ts`

**Interfaces:**
- Consumes: `buildReportWorkbook(model, templateBuffer?)`
- Produces: Yönetim Özeti `J5` ve `D11:D30` için beyaz tabanlı, 0–1 eşikli kırmızı veri çubuğu koşullu biçimlendirmesi.

- [ ] **Step 1: Write the failing test** — Çıktı çalışma kitabında ilgili hücrelerin beyaz taban, `dataBar` türü, 0 ve 1 sayısal eşikleri ve görünür değer kullandığını doğrula.
- [ ] **Step 2: Run test to verify it fails** — `npm test -- --run tests/integration/report-workbook.test.ts`; Expected: eski `colorScale` kuralı nedeniyle FAIL.
- [ ] **Step 3: Implement the minimal formatting change** — Eski yüzde renk ölçeğini temizleyip kırmızı gradyanlı, sabit 0–1 eşikli veri çubuğu ekle; yüzde biçimini koru.
- [ ] **Step 4: Run test to verify it passes** — Aynı komut; Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: add proportional rejection rate bars"`.

### Task 2: Kök Sebep Yerleşimi

**Files:**
- Modify: `src/config/report-layout.ts`
- Modify: `src/excel/write-report.ts`
- Test: `tests/integration/report-workbook.test.ts`

**Interfaces:**
- Consumes: Task 1'in güncellenmiş rapor yazıcısı.
- Produces: Detay sayfasında `I32:L32` başlıklı, `I33:J...` kök sebep tablosu ve onu izleyen özel kırılım bölümü.

- [ ] **Step 1: Write the failing test** — Uzun ürün listeli taşıyıcıda kök sebep başlığının `I32`, ilk nedenin `I34` olduğunu ve A:D ürün listesinin korunmasını doğrula.
- [ ] **Step 2: Run test to verify it fails** — `npm test -- --run tests/integration/report-workbook.test.ts`; Expected: başlığın A sütununda 103. satırda olması nedeniyle FAIL.
- [ ] **Step 3: Implement the fixed side layout** — Kök sebep ve özel kırılımı I:L bloğuna taşı, eski A:D kök sebep alanını temizle ve uzun ürün listesiyle bağımsızlaştır.
- [ ] **Step 4: Run test to verify it passes** — Aynı komut; Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: keep detail root causes near charts"`.

### Task 3: Düzenlenebilir Saatlik Yoğunluk Grafikleri

**Files:**
- Create: `src/excel/add-hourly-charts.ts`
- Modify: `src/excel/write-report.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `tests/integration/report-workbook.test.ts`

**Interfaces:**
- Consumes: ExcelJS tarafından üretilen `Uint8Array`, `ReportModel` ve sabit saat kaynak aralıkları.
- Produces: `addHourlyCharts(workbookBytes, model): Promise<Uint8Array>`; Saat Yoğunluk sayfası ve dolu nakliyeci detay sayfaları için kaynak hücrelere bağlı sütun grafikleri.

- [ ] **Step 1: Write the failing test** — XLSX paketindeki grafik/drawing sayısını, toplam grafiğin `A6:B29`, detay grafiğinin `F11:G34` kaynaklarını ve boş detay yuvalarında grafik olmadığını doğrula.
- [ ] **Step 2: Run test to verify it fails** — `npm test -- --run tests/integration/report-workbook.test.ts`; Expected: `xl/charts` parçaları bulunmadığı için FAIL.
- [ ] **Step 3: Implement OOXML chart injection** — JSZip ile içerik türlerini, çalışma sayfası ilişkilerini, drawing ve chart parçalarını ekle; grafikleri `Saatlik Kayıt Yoğunluğu` başlığı, mavi seri, veri etiketi ve sıfır tabanlı eksenle konumlandır.
- [ ] **Step 4: Run test to verify it passes** — Aynı komut; Expected: PASS.
- [ ] **Step 5: Commit** — `git add ... && git commit -m "feat: add hourly intensity charts to reports"`.

### Task 4: Bütünleşik Doğrulama ve Yayın Hazırlığı

**Files:**
- Modify: `README.md` only if usage behavior needs clarification.
- Test: existing test and build configuration.

**Interfaces:**
- Consumes: Tasks 1–3 çıktıları.
- Produces: Test edilmiş, görsel olarak doğrulanmış ve yayınlanabilir web uygulaması.

- [ ] **Step 1: Run the full automated suite** — `npm test -- --run`; Expected: 45 existing tests plus new tests PASS.
- [ ] **Step 2: Run static checks and production build** — `npm run lint && npm run build`; Expected: both PASS.
- [ ] **Step 3: Generate a representative XLSX and inspect** — Yönetim Özeti, Saat Yoğunluk ve ilk taşıyıcı detayında değerler, koşullu biçimlendirme, grafikler ve yakın kök sebep yerleşimini doğrula.
- [ ] **Step 4: Commit verification-only changes if any** — Yalnızca gerekli belge değişikliklerini commit et.
