import { useRef, useState } from "react";
import { FileSpreadsheet, LockKeyhole, UploadCloud } from "lucide-react";

interface FileUploadCardProps {
  fileName: string;
  busy: boolean;
  onFile: (file: File) => void | Promise<void>;
}

export function FileUploadCard({ fileName, busy, onFile }: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function accept(files: FileList | null) {
    const file = files?.[0];
    if (file) void onFile(file);
  }

  return (
    <section className="panel upload-panel" aria-labelledby="upload-title">
      <div className="panel-heading compact">
        <div>
          <span className="section-kicker">BAŞLANGIÇ</span>
          <h2 id="upload-title">Ham Excel dosyanızı yükleyin</h2>
          <p>Araç Kayıt Sorgu çıktısının yalnızca <strong>.xlsx</strong> biçimini kullanın.</p>
        </div>
        <span className="file-type"><FileSpreadsheet size={18} /> XLSX</span>
      </div>
      <div
        className={`drop-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id="workbook-upload"
          className="visually-hidden"
          type="file"
          accept=".xlsx"
          aria-label="Araç kayıt sorgu Excel dosyası"
          disabled={busy}
          onChange={(event) => accept(event.target.files)}
        />
        <div className="upload-icon"><UploadCloud size={30} /></div>
        <div className="upload-copy">
          <strong>{busy ? "Dosya analiz ediliyor…" : fileName || "Dosyayı buraya sürükleyin"}</strong>
          <span>{fileName ? "Başka bir dosya seçebilirsiniz" : "veya bilgisayarınızdan seçin"}</span>
        </div>
        <button className="button upload-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Okunuyor…" : fileName ? "Dosyayı değiştir" : "Excel dosyası seç"}
        </button>
      </div>
      <div className="privacy-note"><LockKeyhole size={16} /> Dosyanız bu cihazdan dışarı gönderilmez ve hiçbir sunucuda saklanmaz.</div>
    </section>
  );
}
