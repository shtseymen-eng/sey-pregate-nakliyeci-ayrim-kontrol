import { AlertTriangle } from "lucide-react";
import type { ReportWarning } from "@/types/report";

export function WarningsPanel({ warnings }: { warnings: ReportWarning[] }) {
  if (!warnings.length) return null;
  return (
    <aside className="warning-strip" aria-label="Rapor uyarıları">
      <AlertTriangle size={19} />
      <div>{warnings.map((warning) => <span key={warning.kind}>{warning.message}{warning.count !== undefined ? ` (${warning.count})` : ""}</span>)}</div>
    </aside>
  );
}
