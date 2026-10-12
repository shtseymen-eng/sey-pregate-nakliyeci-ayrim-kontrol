import { CheckCircle2, FileCheck2 } from "lucide-react";
import type { NormalizationResult } from "@/types/import";

interface ValidationSummaryProps {
  fileName: string;
  sheetName: string;
  result: NormalizationResult;
}

export function ValidationSummary({ fileName, sheetName, result }: ValidationSummaryProps) {
  const items = [
    ["Okunan satır", result.departmentSummary.rowsRead, "rows-count"],
    ["Poliport Terminal kayıtları", result.records.length, "included-count"],
    ["Diğer departmanlar", result.departmentSummary.rowsExcludedDepartment, "excluded-count"],
    ["Geçersiz satır", result.invalidRows.length, "invalid-count"],
  ] as const;
  return (
    <section className="panel validation-panel" aria-labelledby="validation-title">
      <div className="validation-title-row">
        <div className="file-identity"><FileCheck2 size={22} /><div><h2 id="validation-title">Dosya kontrolü tamamlandı</h2><p>{fileName} • {sheetName}</p></div></div>
        <span className="success-pill"><CheckCircle2 size={16} /> Yalnızca Poliport Terminal</span>
      </div>
      <div className="validation-grid">
        {items.map(([label, value, testId]) => <div key={label}><span>{label}</span><strong data-testid={testId}>{value.toLocaleString("tr-TR")}</strong></div>)}
      </div>
    </section>
  );
}
