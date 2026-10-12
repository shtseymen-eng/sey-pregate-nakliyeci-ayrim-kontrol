import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { makeSyntheticWorkbook } from "../fixtures/synthetic-workbook";

const { buildReportWorkbook } = vi.hoisted(() => ({
  buildReportWorkbook: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock("@/excel/write-report", () => ({ buildReportWorkbook }));

function excelFile(bytes: ArrayBuffer, name = "arac-kayit-sorgu.xlsx") {
  return new File([bytes], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("Sey-Pregate app flow", () => {
  beforeEach(() => {
    buildReportWorkbook.mockClear();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:report"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("opens with a clear local-only Excel upload action", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Sey-Pregate Nakliyeci Ayrım Kontrol" })).toBeVisible();
    expect(screen.getByText("Ham Excel dosyanızı yükleyin")).toBeVisible();
    expect(screen.getByText(/dosyanız bu cihazdan dışarı gönderilmez/i)).toBeVisible();
    expect(screen.getByLabelText("Araç kayıt sorgu Excel dosyası")).toHaveAttribute(
      "accept",
      ".xlsx",
    );
  });

  it("filters other departments and prepares one shared preview for download", async () => {
    const user = userEvent.setup();
    const bytes = await makeSyntheticWorkbook({
      rows: [
        ["01.09.2026", "08:15", "Poliport Terminal", "Firma A", "Ürün X", "Onaylandı", "", "Müşteri"],
        ["01.09.2026", "09:00", "Depo Operasyon", "Firma B", "Ürün Y", "Red", "SRC5 yok", "Müşteri"],
        ["02.09.2026", "10:30", " poliport   terminal ", "Firma A", "Ürün X", "Red", "SRC5 belgesi yoktur", "Müşteri"],
      ],
    });
    render(<App />);

    await user.upload(
      screen.getByLabelText("Araç kayıt sorgu Excel dosyası"),
      excelFile(bytes),
    );

    expect(await screen.findByRole("heading", { name: "Rapor önizlemesi" })).toBeVisible();
    expect(screen.getByTestId("included-count")).toHaveTextContent("2");
    expect(screen.getByTestId("excluded-count")).toHaveTextContent("1");
    expect(screen.getByTestId("registration-count")).toHaveTextContent("2");
    expect(screen.getByText("Firma A")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Excel raporunu indir" }));
    await waitFor(() => expect(buildReportWorkbook).toHaveBeenCalledTimes(1));
  });

  it("blocks report generation until each unknown status is classified", async () => {
    const user = userEvent.setup();
    const bytes = await makeSyntheticWorkbook({
      rows: [
        ["01.09.2026", "08:15", "Poliport Terminal", "Firma A", "Ürün X", "Yeni Durum", "", "Müşteri"],
      ],
    });
    render(<App />);

    await user.upload(
      screen.getByLabelText("Araç kayıt sorgu Excel dosyası"),
      excelFile(bytes, "bilinmeyen-durum.xlsx"),
    );

    expect(await screen.findByRole("heading", { name: "Sınıflandırılmamış durumlar" })).toBeVisible();
    expect(screen.getByText("Yeni Durum")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Rapor önizlemesi" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excel raporunu indir" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Red değil" }));

    expect(await screen.findByRole("heading", { name: "Rapor önizlemesi" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Excel raporunu indir" })).toBeEnabled();
  });
});
