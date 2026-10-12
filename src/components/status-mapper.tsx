import { CircleHelp } from "lucide-react";
import type { StatusDisposition, StatusRuleMap, UnknownStatus } from "@/types/import";

interface StatusMapperProps {
  statuses: UnknownStatus[];
  rules: StatusRuleMap;
  onChange: (status: string, disposition: StatusDisposition) => void;
}

const OPTIONS: Array<{ value: StatusDisposition; label: string }> = [
  { value: "red", label: "Red" },
  { value: "not-red", label: "Red değil" },
  { value: "exclude", label: "Hariç" },
];

export function StatusMapper({ statuses, rules, onChange }: StatusMapperProps) {
  return (
    <section className="panel attention-panel" aria-labelledby="status-title">
      <div className="panel-heading">
        <div className="heading-icon amber"><CircleHelp size={23} /></div>
        <div>
          <span className="section-kicker amber-text">KARAR GEREKİYOR</span>
          <h2 id="status-title">Sınıflandırılmamış durumlar</h2>
          <p>Hatalı red oranını önlemek için her yeni durumun raporda nasıl değerlendirileceğini seçin.</p>
        </div>
      </div>
      <div className="status-list">
        {statuses.map((status) => (
          <fieldset key={status.normalized}>
            <legend><strong>{status.label}</strong><span>{status.count} kayıt</span></legend>
            <div className="segmented">
              {OPTIONS.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name={`status-${status.normalized}`}
                    checked={rules[status.normalized] === option.value}
                    onChange={() => onChange(status.normalized, option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}
