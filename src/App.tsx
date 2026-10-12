import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, RefreshCw, ShieldCheck } from "lucide-react";
import { buildReportModel } from "@/analysis/build-report";
import { normalizeRecords } from "@/analysis/normalize-records";
import { collectUnknownStatuses } from "@/analysis/status-classifier";
import { ColumnMapper } from "@/components/column-mapper";
import { FileUploadCard } from "@/components/file-upload-card";
import { ReportPreview } from "@/components/preview/report-preview";
import { StatusMapper } from "@/components/status-mapper";
import { ValidationSummary } from "@/components/validation-summary";
import { WarningsPanel } from "@/components/warnings-panel";
import { REQUIRED_FIELDS } from "@/config/column-aliases";
import { buildReportFileName } from "@/excel/build-file-name";
import { readWorkbook } from "@/excel/read-workbook";
import { buildReportWorkbook } from "@/excel/write-report";
import type {
  ColumnMapping,
  NormalizationResult,
  SemanticField,
  StatusDisposition,
  StatusRuleMap,
  WorkbookCandidate,
} from "@/types/import";
import "./styles.css";

type Phase = "idle" | "reading" | "mapping" | "review" | "exporting";

function completeMapping(mapping: Partial<ColumnMapping>): mapping is ColumnMapping {
  return REQUIRED_FIELDS.every((field) => mapping[field] !== undefined);
}

function importSummary(normalization: NormalizationResult) {
  return {
    rowsRead: normalization.departmentSummary.rowsRead,
    rowsIncluded: normalization.records.length,
    rowsExcludedDepartment: normalization.departmentSummary.rowsExcludedDepartment,
    invalidRows: normalization.invalidRows.length,
    warnings: normalization.warnings,
  };
}

function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Dosya tarayıcı belleğine okunamadı."));
    reader.readAsArrayBuffer(file);
  });
}

export function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [candidate, setCandidate] = useState<WorkbookCandidate | null>(null);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [normalization, setNormalization] = useState<NormalizationResult | null>(null);
  const [statusRules, setStatusRules] = useState<StatusRuleMap>({});
  const [error, setError] = useState("");

  const unknownStatuses = useMemo(
    () => normalization ? collectUnknownStatuses(normalization.records, statusRules) : [],
    [normalization, statusRules],
  );

  const reportResult = useMemo(() => {
    if (!normalization || normalization.blockingErrors.length || unknownStatuses.length) {
      return { report: null, error: "" };
    }
    try {
      return { report: buildReportModel({
        records: normalization.records,
        statusRules,
        importSummary: importSummary(normalization),
      }), error: "" };
    } catch (caught) {
      return {
        report: null,
        error: caught instanceof Error ? caught.message : "Rapor hazırlanamadı.",
      };
    }
  }, [normalization, statusRules, unknownStatuses.length]);
  const report = reportResult.report;

  function applyMapping(nextCandidate: WorkbookCandidate, nextMapping: ColumnMapping) {
    const result = normalizeRecords(nextCandidate.rows, nextMapping, nextCandidate.headerRowNumber);
    setNormalization(result);
    setStatusRules({});
    setError(result.blockingErrors.join(" "));
    setPhase("review");
  }

  async function handleFile(file: File) {
    setError("");
    setNormalization(null);
    setCandidate(null);
    setStatusRules({});
    setFileName(file.name);
    setPhase("reading");
    try {
      const nextCandidate = await readWorkbook(await readFileBuffer(file), file.name);
      const suggested = nextCandidate.suggestion.mapping;
      setCandidate(nextCandidate);
      setMapping(suggested);
      if (completeMapping(suggested)) applyMapping(nextCandidate, suggested);
      else setPhase("mapping");
    } catch (caught) {
      setPhase("idle");
      setError(caught instanceof Error ? caught.message : "Dosya okunamadı.");
    }
  }

  function handleMappingChange(field: SemanticField, column: number | undefined) {
    setMapping((current) => ({ ...current, [field]: column }));
  }

  function confirmMapping() {
    if (!candidate || !completeMapping(mapping)) {
      setError("Devam etmek için bütün zorunlu alanları eşleştirin.");
      return;
    }
    setError("");
    applyMapping(candidate, mapping);
  }

  function setStatusRule(status: string, disposition: StatusDisposition) {
    setStatusRules((current) => ({ ...current, [status]: disposition }));
    setError("");
  }

  async function downloadReport() {
    if (!report) return;
    setPhase("exporting");
    setError("");
    try {
      const bytes = await buildReportWorkbook(report);
      const safeBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([safeBytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildReportFileName(report.period);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Excel raporu oluşturulamadı.");
    } finally {
      setPhase("review");
    }
  }

  function reset() {
    setPhase("idle");
    setFileName("");
    setCandidate(null);
    setMapping({});
    setNormalization(null);
    setStatusRules({});
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Sey-Pregate ana sayfa">
          <span className="brand-mark"><FileSpreadsheet size={21} /></span>
          <span>Sey-Pregate</span>
        </a>
        <span className="privacy-badge"><ShieldCheck size={16} /> Veriler yalnızca tarayıcıda işlenir</span>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow">POLİPORT TERMİNAL • AYLIK RAPORLAMA</div>
          <h1>Sey-Pregate Nakliyeci Ayrım Kontrol</h1>
          <p>Ham araç kayıt sorgusunu yükleyin; ilk 20 nakliyeci, red oranları ve kök sebepler tek işlemle hazır olsun.</p>
          <div className="step-row" aria-label="Rapor hazırlama adımları">
            <span className={phase !== "idle" ? "done" : "active"}><b>1</b> Dosyayı yükle</span>
            <span className={normalization ? "done" : phase === "mapping" ? "active" : ""}><b>2</b> Veriyi kontrol et</span>
            <span className={report ? "done" : ""}><b>3</b> Raporu indir</span>
          </div>
        </section>

        <div className="workspace">
          <FileUploadCard fileName={fileName} busy={phase === "reading"} onFile={handleFile} />
          {(error || reportResult.error) && <div className="alert error" role="alert">{error || reportResult.error}</div>}
          {phase === "mapping" && candidate && (
            <ColumnMapper headers={candidate.headers} mapping={mapping} onChange={handleMappingChange} onConfirm={confirmMapping} />
          )}
          {normalization && (
            <ValidationSummary fileName={fileName} sheetName={candidate?.sheetName ?? ""} result={normalization} />
          )}
          {unknownStatuses.length > 0 && (
            <StatusMapper statuses={unknownStatuses} rules={statusRules} onChange={setStatusRule} />
          )}
          {report && <WarningsPanel warnings={report.warnings} />}
          {report && <ReportPreview report={report} fileName={fileName} />}
          {(normalization || report) && (
            <div className="action-dock">
              <div className="dock-state">
                {report ? <CheckCircle2 size={20} /> : <RefreshCw size={20} />}
                <span>{report ? "Rapor indirilmeye hazır" : "Kontrol edilmesi gereken alanlar var"}</span>
              </div>
              <div className="dock-actions">
                <button className="button secondary" type="button" onClick={reset}>Yeni dosya yükle</button>
                <button className="button primary" type="button" onClick={downloadReport} disabled={!report || phase === "exporting"}>
                  <Download size={18} /> {phase === "exporting" ? "Excel hazırlanıyor…" : "Excel raporunu indir"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer>Poliport Terminal dışındaki departmanlar rapora dahil edilmez.</footer>
    </div>
  );
}
