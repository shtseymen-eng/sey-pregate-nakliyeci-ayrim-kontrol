import type { CarrierReport } from "@/types/report";

function percent(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function CarrierDetail({ carrier }: { carrier: CarrierReport }) {
  return (
    <section className="detail-card">
      <div className="detail-heading">
        <div><span className="section-kicker">NAKLİYECİ DETAYI</span><h3>{carrier.rank}. {carrier.name}</h3></div>
        <div className="detail-stats"><span><b>{carrier.registrations}</b> kayıt</span><span><b>{carrier.rejections}</b> red</span><span><b>{percent(carrier.rejectionRate)}</b> red oranı</span></div>
      </div>
      <div className="detail-grid">
        <div><h4>Ürün dağılımı</h4><div className="mini-table">{carrier.products.slice(0, 8).map((product) => <div key={product.name}><span>{product.name}</span><b>{product.registrations}</b><em>{percent(product.rejectionRate)}</em></div>)}</div></div>
        <div><h4>Kök sebepler</h4><div className="reason-cloud">{carrier.rootCauses.slice(0, 8).map((cause) => <span key={`${cause.label}-${cause.matched}`}>{cause.label}<b>{cause.count}</b></span>)}{!carrier.rootCauses.length && <p className="empty-copy">Red kök sebebi bulunmadı.</p>}</div></div>
      </div>
    </section>
  );
}
