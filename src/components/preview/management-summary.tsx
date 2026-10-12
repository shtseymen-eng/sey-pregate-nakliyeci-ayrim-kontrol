import { Building2, CircleX, Gauge, Truck } from "lucide-react";
import type { ReportModel } from "@/types/report";

function percent(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function ManagementSummary({ report }: { report: ReportModel }) {
  const cards = [
    { label: "Toplam nakliyeci", value: report.totals.carriers, icon: Building2, tone: "blue" },
    { label: "Toplam araç kaydı", value: report.totals.registrations, icon: Truck, tone: "navy", testId: "registration-count" },
    { label: "Geçerli red", value: report.totals.rejections, icon: CircleX, tone: "red" },
    { label: "Red oranı", value: percent(report.totals.rejectionRate), icon: Gauge, tone: "purple" },
  ];
  return (
    <>
      <div className="kpi-grid">
        {cards.map(({ label, value, icon: Icon, tone, testId }) => (
          <article className="kpi-card" key={label}>
            <div className={`kpi-icon ${tone}`}><Icon size={20} /></div>
            <span>{label}</span>
            <strong data-testid={testId}>{typeof value === "number" ? value.toLocaleString("tr-TR") : value}</strong>
          </article>
        ))}
      </div>
      <div className="table-card">
        <div className="table-title"><div><span className="section-kicker">SIRALAMA</span><h3>İlk 20 nakliyeci</h3></div><span>Toplam araç kaydına göre</span></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>#</th><th>Nakliyeci</th><th>Toplam</th><th>Red</th><th>Red oranı</th><th>Aktif gün</th><th>Günlük ort.</th><th>En çok alınan ürün</th><th>Yoğun saat</th></tr></thead>
            <tbody>{report.topCarriers.map((carrier) => (
              <tr key={carrier.name}>
                <td><span className="rank">{carrier.rank}</span></td>
                <td><strong>{carrier.name}</strong></td>
                <td>{carrier.registrations}</td>
                <td>{carrier.rejections}</td>
                <td><span className={`rate ${carrier.rejectionRate >= .15 ? "high" : ""}`}>{percent(carrier.rejectionRate)}</span></td>
                <td>{carrier.activeDays}</td>
                <td>{carrier.dailyAverage?.toLocaleString("tr-TR", { minimumFractionDigits: 1 }) ?? "—"}</td>
                <td>{carrier.topProduct?.name ?? "—"}</td>
                <td>{String(carrier.peakHour.hour).padStart(2, "0")}:00 <small>({carrier.peakHour.count})</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
