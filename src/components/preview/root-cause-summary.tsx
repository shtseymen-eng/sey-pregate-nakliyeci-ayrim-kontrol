import type { ReportModel } from "@/types/report";

export function RootCauseSummary({ report }: { report: ReportModel }) {
  const maximum = Math.max(...report.rootCauses.map((cause) => cause.count), 1);
  const peak = report.hourlyTotals.reduce(
    (best, count, hour) => count > best.count ? { hour, count } : best,
    { hour: 0, count: report.hourlyTotals[0] },
  );
  return (
    <div className="analysis-grid">
      <section className="analysis-card">
        <div className="table-title"><div><span className="section-kicker">RED ANALİZİ</span><h3>En sık kök sebepler</h3></div></div>
        <div className="cause-list">{report.rootCauses.slice(0, 6).map((cause) => (
          <div key={`${cause.label}-${cause.matched}`} className="cause-row">
            <div><span>{cause.label}</span><strong>{cause.count}</strong></div>
            <div className="bar-track"><i style={{ width: `${Math.max((cause.count / maximum) * 100, 3)}%` }} /></div>
          </div>
        ))}{!report.rootCauses.length && <p className="empty-copy">Bu dönemde red kök sebebi bulunmadı.</p>}</div>
      </section>
      <section className="analysis-card hourly-card">
        <div className="table-title"><div><span className="section-kicker">SAAT YOĞUNLUĞU</span><h3>24 saatlik dağılım</h3></div><span>En yoğun {String(peak.hour).padStart(2, "0")}:00</span></div>
        <div className="hour-chart" aria-label="Saatlik araç kayıt dağılımı">{report.hourlyTotals.map((count, hour) => (
          <div key={hour} title={`${String(hour).padStart(2, "0")}:00 • ${count} kayıt`}>
            <i style={{ height: `${Math.max((count / Math.max(peak.count, 1)) * 100, count ? 8 : 2)}%` }} />
            <span>{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}</span>
          </div>
        ))}</div>
      </section>
    </div>
  );
}
