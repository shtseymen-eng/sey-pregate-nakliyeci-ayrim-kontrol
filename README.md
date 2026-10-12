# Sey-Pregate Nakliyeci Ayrım Kontrol

Ham **Araç Kayıt Sorgu** Excel dosyasından yalnızca **Poliport Terminal** kayıtlarını seçerek ilk 20 nakliyeci raporunu hazırlayan tarayıcı uygulamasıdır.

## Ne üretir?

- Yönetim özeti ve dönem tarih aralığı
- Araç kayıt sayısına göre ilk 20 nakliyeci
- Nakliyeci bazında toplam kayıt, red sayısı ve red oranı
- Ürün, saat yoğunluğu ve kök sebep analizleri
- Mevcut tasarımı koruyan 23 sayfalık indirilebilir `.xlsx` raporu

## Kullanım

1. GitHub Pages bağlantısını açın.
2. Araç Kayıt Sorgu dosyasını `.xlsx` biçiminde yükleyin.
3. Gerekirse tanınmayan sütunları veya durumları eşleştirin.
4. Tarayıcı önizlemesini kontrol edin.
5. **Excel raporunu indir** düğmesine basın.

Yüklenen dosya tamamen tarayıcı belleğinde işlenir. Ham veri bir sunucuya gönderilmez, GitHub'a yüklenmez ve kalıcı olarak saklanmaz.

## Rapor kuralları

- Yalnızca yazım/boşluk farkları normalize edilmiş `Poliport Terminal` departmanı kapsama alınır.
- Diğer departmanlar tarih aralığına ve hiçbir KPI'a dahil edilmez.
- Her ham satır bir araç kaydıdır; otomatik tekilleştirme yapılmaz.
- Pregate, sırada ve beklemede durumları red sayılmaz.
- Tanınmayan boş olmayan durumlar kullanıcı sınıflandırması olmadan rapora alınmaz.
- Çıktı daima 3 genel + 20 nakliyeci detay sayfasından oluşur.

## Yerel geliştirme

```bash
npm ci
npm run dev
```

Kalite kontrolleri:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`main` dalına yapılan her gönderim testlerden geçtikten sonra GitHub Pages'a otomatik yayımlanır.
