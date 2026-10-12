# Terminal İlk 20 Web Uygulaması — Tasarım Belgesi

Tarih: 11 Ekim 2026

## 1. Amaç

Kullanıcı tek bir ham **Araç Kayıt Sorgu** Excel dosyası yüklediğinde uygulama dosyadaki dönemi ve kayıt yapısını analiz eder, nakliyecileri toplam araç kayıt sayısına göre sıralar, ilk 20 nakliyeci için mevcut raporla aynı kapsam ve görünümde yeni bir Excel raporu üretir.

Uygulama şu çıktıları birlikte sunar:

- Tarayıcıda yönetim özeti ve temel analizlerin önizlemesi.
- Veri kalitesi ve eşleştirme uyarıları.
- Mevcut rapor yapısını koruyan indirilebilir `.xlsx` dosyası.

Başarı ölçütü, kullanıcının tek bir dosya yükleyip sütunları doğruladıktan sonra başka bir işlem yapmadan eksiksiz raporu önizleyebilmesi ve indirebilmesidir.

## 2. Kullanıcı Akışı

1. Kullanıcı uygulamayı açar.
2. `Araç Kayıt Sorgu Dosyasını Seç` alanından bir `.xlsx` dosyası yükler.
3. Uygulama çalışma kitabındaki uygun veri sayfasını ve başlık satırını belirler.
4. Uygulama gerekli alanları başlık adları ve eş anlamlı başlıklar üzerinden otomatik eşleştirir.
5. Zorunlu bir alan bulunamazsa kullanıcı kısa bir eşleştirme ekranından ilgili sütunu seçer.
6. Uygulama departman alanında yalnızca `Poliport Terminal` kayıtlarını seçer; diğer departmanları hesaplamadan çıkarır.
7. Uygulama veri doğrulamasını yapar ve şu bilgileri gösterir:
   - Okunan satır sayısı.
   - Poliport Terminal kapsamına alınan ve diğer departmanlar nedeniyle dışarıda bırakılan satır sayısı.
   - Geçerli kayıt sayısı.
   - En erken ve en geç kayıt tarihi.
   - Bulunan nakliyeci sayısı.
   - Tanınmayan durum ve kök sebep sayısı.
8. Kullanıcı `Raporu Hazırla` düğmesine basar.
9. Uygulama tarayıcıda yönetim özeti, ilk 20 nakliyeci ve red/kök sebep analizlerini gösterir.
10. Kullanıcı `Excel Raporunu İndir` düğmesiyle hazırlanmış raporu indirir.
11. Kullanıcı yeni bir dosya seçerek aynı işlemi tekrarlar. Önceki ham veri tarayıcı belleğinden temizlenir.

## 3. Gizlilik ve Dağıtım Modeli

Uygulama statik ve tarayıcı içinde çalışan bir web uygulaması olacaktır. Ham Excel dosyası bir sunucuya gönderilmeyecek, kalıcı olarak saklanmayacak ve GitHub deposuna eklenmeyecektir.

Kaynak kod özel bir GitHub deposunda tutulacaktır. Depoda yalnızca uygulama kodu, otomatik testler ve verisiz/sentetik test örnekleri bulunacaktır. Mevcut gerçek rapor dosyası ve gerçek nakliyeci verileri depoya eklenmeyecektir.

Uygulama ilk dağıtımda özel erişimli olarak yayımlanacaktır. Sonradan kamuya açılması ayrı bir erişim kararıdır ve rapor üretim mantığını değiştirmez.

## 4. Teknik Mimari

Uygulama aşağıdaki bağımsız bölümlerden oluşacaktır:

### 4.1 Dosya Okuyucu

- Tarayıcıdaki dosya seçiciden `.xlsx` dosyasını alır.
- Dosyayı yalnızca tarayıcı belleğinde açar.
- Çalışma sayfalarını ve olası başlık satırlarını inceler.
- Büyük dosyalarda kullanıcıya işlem durumu gösterir.

İlk sürüm `.xlsx` dosyalarını destekler. Eski `.xls` biçimi kabul edilmez; kullanıcıdan dosyayı `.xlsx` olarak kaydetmesi istenir.

### 4.2 Sütun Eşleştirme

Rapor için gereken anlam alanları şunlardır:

- Kayıt tarihi.
- Kayıt saati veya tarih-saat alanı.
- Departman/tesis adı.
- Nakliyeci/firma adı.
- Ürün/malzeme adı.
- Kayıt durumu.
- Red açıklaması veya kök sebep.
- Varsa müşteri/operasyon alanı; Alışan Ravago/Strene ayrımı için kullanılır.

Başlık tanıma büyük-küçük harf, Türkçe karakter ve boşluk farklılıklarını göz ardı eder. Örneğin `Nakliyeci`, `Nakliyeci Adı`, `Firma` ve `Taşıyıcı` aynı anlam alanı için adaydır.

Otomatik eşleştirmenin kesin olmadığı alanlar kullanıcıya seçtirilir. Aynı dosya düzeni tarayıcıda yerel tercih olarak hatırlanabilir; bu tercih ham veri içermez.

### 4.3 Veri Doğrulama ve Normalleştirme

- Departman değeri baştaki/sondaki boşluklar, büyük-küçük harf ve Türkçe karakter farklılıkları normalize edilerek karşılaştırılır.
- Yalnızca normalize edilmiş departman değeri `Poliport Terminal` olan satırlar kapsama alınır. Diğer iki departmana ve başka değerlere ait satırlar hiçbir toplama, sıralamaya, tarih aralığına veya analize girmez.
- Tarih aralığı ve bütün KPI'lar departman filtresi uygulandıktan sonra hesaplanır.
- Önizleme, toplam okunan satır sayısını ve departman filtresiyle dışarıda bırakılan satır sayısını ayrı gösterir.
- Boş nakliyeci veya geçersiz tarih içeren satırlar hesaplamaya alınmaz ve uyarı sayısına eklenir.
- Tarih aralığı, hesaplamaya alınan satırlardaki en erken ve en geç tarihten otomatik üretilir.
- Saat değeri 00:00–23:59 aralığına dönüştürülür ve saat grubu `00:00`–`23:00` biçiminde oluşturulur.
- Nakliyeci ve ürün adlarında yalnızca baştaki/sondaki gereksiz boşluklar temizlenir. Farklı ticari adlar otomatik olarak birleştirilmez.
- Yinelenen satırlar otomatik silinmez. Ham sorguda bulunan her satır bir araç kaydı olarak kabul edilir.

### 4.4 Red Sınıflandırması

Mevcut rapor kuralı korunur:

- `Pregate`, `sırada` ve `beklemede` anlamındaki durumlar geçerli red sayısına dahil edilmez.
- Dosyada açık bir `Red` durumu bulunuyorsa bu durum red adayı olarak kabul edilir.
- Durum alanı boşken red açıklaması/kök sebep alanı doluysa kayıt red adayı olarak kabul edilir.
- Uygulama, dosyada bulunan durum değerlerini rapor üretmeden önce özetler. Tanınmayan ve boş olmayan durumlar kullanıcı tarafından `Red`, `Red değil` veya `Hariç` olarak sınıflandırılmadan rapor üretilmez.

Bu yapı, farklı sorgu çıktılarındaki durum yazımlarının yanlış sonuç üretmesini engeller.

### 4.5 Kök Sebep Normalleştirme

- Mevcut rapordaki standart kök sebep başlıkları başlangıç sözlüğü olarak kullanılır.
- Yaygın yazım farklılıkları ve eş anlamlı ifadeler, sırayla çalışan açık anahtar kelime/ifade kurallarıyla standart başlığa bağlanır.
- Bir hücre birden fazla kök sebep içeriyorsa her sebep ayrı sayılır.
- Hiçbir kuralla eşleşmeyen açıklama kaybolmaz; özgün metniyle rapora girer ve önizlemede `Eşleştirilmemiş açıklamalar` uyarısında gösterilir.
- Normalleştirme kuralları uygulama kodunda ayrı, okunabilir bir yapı olarak tutulur ve rapor hesaplamalarından bağımsız test edilir.

### 4.6 Analiz Motoru

Analiz motoru şu sonuçları üretir:

- Toplam benzersiz nakliyeci sayısı.
- Toplam araç kayıt sayısı.
- Geçerli red kayıt sayısı.
- Geçerli red / toplam kayıt oranı.
- Toplam araç kayıt sayısına göre azalan ilk 20 nakliyeci.
- Eşit toplamda nakliyeci adına göre alfabetik ikinci sıralama.
- Nakliyeci bazında toplam kayıt, geçerli red, red oranı, aktif gün ve günlük ortalama.
- Nakliyeci bazında ürün kayıt sayısı, ürün red sayısı ve ürün red oranı.
- Nakliyeci ve genel toplam için 24 saatlik kayıt dağılımı.
- En yoğun saat ve o saatteki kayıt sayısı.
- Genel ve nakliyeci bazında kök sebep sayıları.
- En çok alınan ürün ve ürün adedi.
- Alışan nakliyecisi mevcutsa Ravago/Strene ve Ravago dışı özel kırılımı.

Aktif gün, ilgili nakliyecinin en az bir geçerli araç kaydı bulunan benzersiz tarih sayısıdır. Günlük ortalama, toplam kayıt / aktif gün olarak bir ondalık basamakla gösterilir. Sıfır aktif gün durumunda sonuç boş bırakılır; sıfır gibi gösterilmez.

### 4.7 Excel Üretici

Excel üretici, gerçek iş verisi içermeyen ve mevcut raporun görünüm kurallarını taşıyan bir şablon kullanır. Üretilen dosyada görünür sayfa sırası korunur:

1. `Yönetim Özeti`
2. `Kök Sebep Analizi`
3. `Saat Yoğunluk`
4. İlk 20 nakliyeci detay sayfası

Detay sayfaları sıralama numarası ve nakliyeci adıyla yeniden adlandırılır. Excel'in 31 karakterlik sayfa adı sınırı uygulanır; sayfa içindeki tam başlık kısaltılmaz.

Her detay sayfasında şu alanlar mevcut yerleşimde oluşturulur:

- Toplam kayıt, geçerli red ve red oranı kartları.
- Ürün bazında kayıt tablosu.
- 24 saatlik kayıt dağılımı.
- Kök sebepler tablosu.
- Alışan için özel Ravago/Strene bölümleri.

İlk 20'den az nakliyeci varsa görünür sayfa sayısı korunur; kullanılmayan detay sayfalarında `Bu dönem için veri yok` mesajı gösterilir. Veri satırı sayısına bağlı bölümler aşağı doğru genişler, fakat başlık, renk, yazı tipi, sütun genişliği, sayı biçimi ve bölüm düzeni değişmez.

Dosya adı `Terminal_Ilk20_DD.MM.YYYY_DD.MM.YYYY.xlsx` biçimindedir.

## 5. Tarayıcı Önizlemesi

Önizleme Excel'in hücre hücre taklidi olmayacaktır. Raporu hızlı kontrol etmeyi sağlayan, aynı renk dilini kullanan bir kontrol ekranı olacaktır:

- Dosya adı ve bulunan tarih aralığı.
- Toplam nakliyeci, toplam araç kaydı, geçerli red ve red oranı.
- İlk 20 nakliyeci tablosu.
- En sık red kök sebepleri.
- Saat yoğunluğu özeti.
- Seçilen nakliyecinin ürün, saat ve kök sebep detayları.
- Geçersiz satır, tanınmayan durum ve eşleştirilmemiş kök sebep uyarıları.

Kullanıcı önizlemeden farklı bir nakliyeci seçebilir. Önizlemedeki değerler ile indirilen Excel aynı hesaplama sonucunu kullanır; iki ayrı hesaplama yapılmaz.

## 6. Arayüz Tasarımı

Tek sayfalı, sade bir çalışma ekranı kullanılacaktır:

1. Üst bölüm: `Terminal İlk 20 Nakliyeci Raporu` başlığı ve kısa açıklama.
2. Yükleme kartı: dosya seçimi, kabul edilen biçim ve gizlilik bilgisi.
3. Eşleştirme/uyarı alanı: yalnızca gerektiğinde görünür.
4. İşlem düğmesi: `Raporu Hazırla`.
5. Önizleme: yönetim özeti ve analiz sekmeleri.
6. Son işlem: `Excel Raporunu İndir` ve `Yeni Dosya Yükle` düğmeleri.

Arayüz masaüstünde geniş tabloları rahat gösterecek, tablette kullanılabilir olacak ve küçük ekranlarda yatay kaydırmayı kontrollü biçimde sunacaktır. Klavye kullanımı, dosya seçim etiketi, hata mesajları ve renk kontrastı erişilebilir olacaktır.

## 7. Hata Yönetimi

Rapor üretilmeden işlem durdurulacak durumlar:

- Dosyanın açılamaması veya şifreli olması.
- Desteklenmeyen dosya biçimi.
- Veri sayfasının/başlık satırının bulunamaması.
- Kayıt tarihi, departman, nakliyeci, ürün, durum veya red açıklaması alanlarından birinin sütun olarak eşleştirilememesi.
- Departman filtresinden sonra hiç `Poliport Terminal` kaydı kalmaması.
- Hesaplamaya uygun hiç satır kalmaması.

Rapor üretimini engellemeyen fakat gösterilecek uyarılar:

- Ürün, saat, durum veya red açıklaması alanının bazı satırlarda boş olması.
- Tanınmayan durum değerleri.
- Eşleştirilmemiş kök sebep açıklamaları.
- İlk 20'den az nakliyeci bulunması.

Bir hata oluştuğunda kullanıcı yeni dosya seçmeden eşleştirmeyi düzeltebilir veya dosyayı yeniden işleyebilir. Yarım hazırlanmış Excel indirmeye sunulmaz.

## 8. Test ve Doğrulama

Gerçek iş verisi içermeyen sentetik test dosyalarıyla aşağıdaki kontroller otomatikleştirilir:

- Türkçe karakterli başlık ve nakliyeci adları.
- Üç departmanlı dosyada yalnızca Poliport Terminal satırlarının kapsama alınması.
- Departman yazımındaki boşluk, büyük-küçük harf ve Türkçe karakter farklılıklarının doğru eşleşmesi.
- Diğer departman satırlarının tarih aralığı, KPI, ilk 20 ve red analizlerini etkilememesi.
- Bir aylık ve çok aylık tarih aralığı.
- Tarih-saatin tek veya ayrı sütunlarda olması.
- İlk 20 sıralaması ve eşitlik kuralı.
- Pregate/sırada/beklemede hariç tutma kuralları.
- Birden fazla kök sebebin ayrı sayılması.
- Eşleştirilmemiş kök sebebin korunması.
- Boş ve geçersiz satırların uyarılması.
- İlk 20'den az nakliyeci.
- Saat, ürün ve red toplamlarının yönetim özetiyle mutabakatı.
- Excel sayfa sırası, sayfa adları, dönem metni ve temel biçimlerin korunması.

Tarayıcı doğrulamasında dosya yükleme, eşleştirme, önizleme ve indirme akışı uçtan uca çalıştırılır. Üretilen Excel yeniden açılarak 23 sayfa, temel hücre değerleri ve biçimleri kontrol edilir.

## 9. GitHub Deposu ve Dosya Yapısı

Önerilen özel depo adı: `terminal-ilk20-rapor`.

Kaynak düzeni:

```text
terminal-ilk20-rapor/
  src/
    components/
    excel/
    analysis/
    config/
    types/
  public/
    templates/
  tests/
    fixtures/
  .github/
    workflows/
  README.md
  package.json
```

`public/templates` içindeki şablon gerçek rakam ve nakliyeci isimleri içermez. `tests/fixtures` yalnızca sentetik veri içerir. `.gitignore` ham yükleme dosyalarını, üretilen raporları, geçici dosyaları ve yerel yapılandırmaları dışarıda bırakır.

README, kurulum, yerel çalıştırma, test, yapı alma, dosya gereksinimleri ve kullanıcı akışını açıklar. GitHub Actions her gönderimde test ve üretim derlemesini çalıştırır.

## 10. Kapsam Dışı

İlk sürümde aşağıdakiler bulunmaz:

- Ham veya üretilmiş raporların çevrim içi geçmişi.
- Kullanıcı hesapları ve rol yönetimi.
- Veritabanı veya sunucuya dosya yükleme.
- PDF rapor üretimi.
- Birden fazla ham dosyanın aynı anda birleştirilmesi.
- `.xls` dosya desteği.

Bu özellikler, temel tek-dosya rapor üretimi doğrulandıktan sonra ayrı kapsam olarak eklenebilir.

## 11. Kabul Kriterleri

Uygulama tamamlanmış sayılırsa:

1. Kullanıcı tek bir `.xlsx` dosyası yükleyebilir.
2. Yalnızca `Poliport Terminal` departmanına ait satırlar kapsama alınır; diğer departmanlar bütün hesaplamalardan çıkarılır.
3. Tarih aralığı Poliport Terminal kayıtlarından otomatik belirlenir ve önizleme/Excel'de gösterilir.
4. İlk 20 nakliyeci yalnızca Poliport Terminal araç kayıt sayısına göre doğru sıralanır.
5. Yönetim özeti, red oranları, ürün/saat dağılımları ve kök sebep analizleri aynı filtrelenmiş veri setinden üretilir.
6. Tarayıcı önizlemesiyle indirilen Excel'in temel toplamları birebir eşleşir.
7. Excel çıktısı mevcut raporun 23 sayfalık görünür yapısını ve görsel düzenini korur.
8. Gerçek ham veri tarayıcı dışına gönderilmez veya GitHub'a yazılmaz.
9. Eksik zorunlu sütunlarda anlaşılır bir eşleştirme veya hata akışı sunulur.
10. Üretilen Excel başarıyla açılır ve rapor adı tarih aralığını içerir.
11. Kaynak kod ve commit geçmişi `terminal-ilk20-rapor` adlı özel GitHub deposuna gönderilir ve otomatik test/derleme iş akışı içerir.
12. Çalışan uygulama özel erişimli bir dağıtım bağlantısında açılır.
