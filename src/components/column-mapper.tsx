import { ArrowRight, Columns3 } from "lucide-react";
import { REQUIRED_FIELDS } from "@/config/column-aliases";
import type { ColumnMapping, SemanticField } from "@/types/import";

const LABELS: Record<SemanticField, string> = {
  date: "Kayıt tarihi",
  time: "Kayıt saati",
  department: "Departman",
  carrier: "Nakliyeci",
  product: "Ürün",
  status: "Durum",
  rejectionReason: "Red açıklaması",
  customer: "Müşteri / operasyon",
};

interface ColumnMapperProps {
  headers: string[];
  mapping: Partial<ColumnMapping>;
  onChange: (field: SemanticField, column: number | undefined) => void;
  onConfirm: () => void;
}

export function ColumnMapper({ headers, mapping, onChange, onConfirm }: ColumnMapperProps) {
  const fields: SemanticField[] = [...REQUIRED_FIELDS, "time", "customer"];
  return (
    <section className="panel" aria-labelledby="mapping-title">
      <div className="panel-heading">
        <div className="heading-icon"><Columns3 size={22} /></div>
        <div>
          <span className="section-kicker">SÜTUN KONTROLÜ</span>
          <h2 id="mapping-title">Eksik alanları eşleştirin</h2>
          <p>Dosya başlıklarındaki ilgili sütunu seçin. Saat ve müşteri alanları isteğe bağlıdır.</p>
        </div>
      </div>
      <div className="mapping-grid">
        {fields.map((field) => (
          <label key={field} className="field-label">
            <span>{LABELS[field]} {REQUIRED_FIELDS.includes(field) && <em>*</em>}</span>
            <select
              value={mapping[field] ?? ""}
              onChange={(event) => onChange(field, event.target.value === "" ? undefined : Number(event.target.value))}
            >
              <option value="">{REQUIRED_FIELDS.includes(field) ? "Sütun seçin" : "Kullanılmayacak"}</option>
              {headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Sütun ${index + 1}`}</option>)}
            </select>
          </label>
        ))}
      </div>
      <div className="panel-actions"><button className="button primary" type="button" onClick={onConfirm}>Eşleştirmeyi uygula <ArrowRight size={18} /></button></div>
    </section>
  );
}
