import { useState } from "react";
import { CalendarDays, Eye } from "lucide-react";
import { CarrierDetail } from "@/components/preview/carrier-detail";
import { ManagementSummary } from "@/components/preview/management-summary";
import { RootCauseSummary } from "@/components/preview/root-cause-summary";
import type { ReportModel } from "@/types/report";

function date(value: Date) {
  return new Intl.DateTimeFormat("tr-TR").format(value);
}

export function ReportPreview({ report, fileName }: { report: ReportModel; fileName: string }) {
  const [selectedRank, setSelectedRank] = useState(report.topCarriers[0]?.rank ?? 1);
  const selected = report.topCarriers.find((carrier) => carrier.rank === selectedRank) ?? report.topCarriers[0];
  return (
    <section className="preview" aria-labelledby="preview-title">
      <div className="preview-heading">
        <div className="preview-title"><span className="heading-icon"><Eye size={22} /></span><div><span className="section-kicker">SONUÇ</span><h2 id="preview-title">Rapor önizlemesi</h2><p>{fileName}</p></div></div>
        <div className="period"><CalendarDays size={18} /><div><span>Rapor dönemi</span><strong>{date(report.period.start)} – {date(report.period.end)}</strong></div></div>
      </div>
      <ManagementSummary report={report} />
      <RootCauseSummary report={report} />
      {selected && <>
        <div className="carrier-picker"><label htmlFor="carrier-preview">Detayını görüntüle</label><select id="carrier-preview" value={selected.rank} onChange={(event) => setSelectedRank(Number(event.target.value))}>{report.topCarriers.map((carrier) => <option key={carrier.rank} value={carrier.rank}>{carrier.rank}. {carrier.name}</option>)}</select></div>
        <CarrierDetail carrier={selected} />
      </>}
    </section>
  );
}
