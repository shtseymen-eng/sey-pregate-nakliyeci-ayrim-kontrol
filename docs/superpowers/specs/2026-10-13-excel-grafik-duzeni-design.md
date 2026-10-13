# Excel Grafik ve Oran Görünümü Tasarımı

## Amaç

Üretilen Poliport Terminal İlk 20 Nakliyeci raporunda red oranlarını beyaz zemin üzerinde oransal kırmızı veri çubuklarıyla göstermek, toplam ve nakliyeci bazında saatlik kayıt yoğunluğu grafiklerini eklemek ve nakliyeci kök sebeplerini ilk görünüm alanına yaklaştırmak.

## Onaylanan Davranış

- Yönetim Özeti'ndeki genel red oranı ve İlk 20 tablosundaki red oranları yüzde değeri görünür kalacak şekilde beyaz zemin üzerinde kırmızı gradyanlı veri çubuğu kullanır.
- Veri çubuğunun ölçeği yüzde 0 ile yüzde 100 arasındadır. Yüzde 50 hücrenin yarısını doldurur.
- Yüksek oran daha uzun ve daha yoğun kırmızı görünür; düşük oran daha kısa ve açık görünür.
- Saat Yoğunluk sayfasında 00:00–23:00 toplam kayıt adetlerini gösteren düzenlenebilir bir Excel sütun grafiği bulunur.
- Her dolu nakliyeci detay sayfasında aynı saat aralığını gösteren düzenlenebilir bir Excel sütun grafiği bulunur.
- Grafik başlığı `Saatlik Kayıt Yoğunluğu` olur, tek mavi seri kullanır, sıfır tabanlı değer eksenine sahiptir ve veri tablosunun yanında yer alır.
- Nakliyeci detay sayfasındaki Kök Sebepler bölümü ürün sayısından bağımsız olarak grafiğin hemen altında, 32. satır civarında görünür.
- Ürün tablosu A:D, saat tablosu F:G düzenini korur. Mevcut sayfa adları, rapor hesaplamaları, Poliport Terminal filtresi ve diğer tasarım öğeleri değişmez.

## Teknik Yaklaşım

Rapor verileri ve biçimleri mevcut ExcelJS akışında üretilir. ExcelJS yerel grafik oluşturmadığı için çıktı paketine küçük, kaynak hücrelere bağlı OOXML grafik parçaları eklenir. Grafikler resim değildir ve Excel içinde düzenlenebilir. Koşullu biçimlendirme kuralları çıktıdan önce temizlenip sabit yüzde ölçekli veri çubuğu olarak yeniden yazılır.

## Doğrulama

- Otomatik testler koşullu biçimlendirme türünü, yüzde 0–1 eşiklerini, beyaz tabanı, grafik sayısını ve grafik kaynak aralıklarını denetler.
- Gerçekçi örnek rapor Excel olarak üretilir ve en az Yönetim Özeti, Saat Yoğunluk ve bir nakliyeci detay sayfası görsel olarak incelenir.
- Tüm mevcut testler, lint ve üretim derlemesi çalıştırılır.
