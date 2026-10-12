import { splitAndNormalizeRootCauses } from "@/analysis/root-causes";
import {
  classifyRecord,
  collectUnknownStatuses,
} from "@/analysis/status-classifier";
import type { NormalizedRecord, StatusDisposition } from "@/types/import";
import type {
  BuildReportInput,
  CarrierReport,
  ProductTotal,
  ReportModel,
  RootCauseTotal,
} from "@/types/report";
import { normalizeForComparison } from "@/utils/text";

interface ClassifiedRecord {
  record: NormalizedRecord;
  disposition: StatusDisposition;
}

function localeSort(left: string, right: string): number {
  return left.localeCompare(right, "tr-TR", { sensitivity: "base" });
}

function aggregateRootCauses(records: ClassifiedRecord[]): RootCauseTotal[] {
  const totals = new Map<string, RootCauseTotal>();
  for (const item of records) {
    if (item.disposition !== "red") continue;
    for (const reason of splitAndNormalizeRootCauses(item.record.rejectionReason)) {
      const key = `${reason.matched ? "matched" : "raw"}:${reason.label}`;
      const total = totals.get(key);
      if (total) total.count += 1;
      else totals.set(key, { label: reason.label, count: 1, matched: reason.matched });
    }
  }
  return [...totals.values()].sort(
    (left, right) => right.count - left.count || localeSort(left.label, right.label),
  );
}

function peakHour(hourlyTotals: number[]): { hour: number; count: number } {
  let hour = 0;
  for (let index = 1; index < hourlyTotals.length; index += 1) {
    if (hourlyTotals[index] > hourlyTotals[hour]) hour = index;
  }
  return { hour, count: hourlyTotals[hour] };
}

function buildCarrier(name: string, rows: ClassifiedRecord[]): CarrierReport {
  const hourlyTotals = Array.from({ length: 24 }, () => 0);
  const days = new Set<string>();
  const productMap = new Map<string, { registrations: number; rejections: number }>();
  let rejections = 0;

  for (const item of rows) {
    hourlyTotals[item.record.hour] += 1;
    const date = item.record.occurredAt;
    days.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    if (item.disposition === "red") rejections += 1;
    const product = productMap.get(item.record.product) ?? {
      registrations: 0,
      rejections: 0,
    };
    product.registrations += 1;
    if (item.disposition === "red") product.rejections += 1;
    productMap.set(item.record.product, product);
  }

  const products: ProductTotal[] = [...productMap.entries()]
    .map(([productName, total]) => ({
      name: productName,
      registrations: total.registrations,
      rejections: total.rejections,
      rejectionRate: total.registrations ? total.rejections / total.registrations : 0,
    }))
    .sort(
      (left, right) =>
        right.registrations - left.registrations || localeSort(left.name, right.name),
    );

  const normalizedCarrier = normalizeForComparison(name);
  const specialBreakdown = normalizedCarrier.includes("alisan")
    ? rows.reduce(
        (result, item) => {
          const customer = normalizeForComparison(item.record.customer);
          const bucket = customer.includes("ravago") || customer.includes("strene")
            ? result.ravagoStrene
            : result.other;
          bucket.registrations += 1;
          if (item.disposition === "red") bucket.rejections += 1;
          return result;
        },
        {
          ravagoStrene: { registrations: 0, rejections: 0 },
          other: { registrations: 0, rejections: 0 },
        },
      )
    : undefined;

  return {
    rank: 0,
    name,
    registrations: rows.length,
    rejections,
    rejectionRate: rows.length ? rejections / rows.length : 0,
    activeDays: days.size,
    dailyAverage: days.size ? Math.round((rows.length / days.size) * 10) / 10 : null,
    products,
    hourlyTotals,
    peakHour: peakHour(hourlyTotals),
    rootCauses: aggregateRootCauses(rows),
    topProduct: products[0]
      ? { name: products[0].name, count: products[0].registrations }
      : null,
    specialBreakdown,
  };
}

export function buildReportModel(input: BuildReportInput): ReportModel {
  if (input.records.length === 0) {
    throw new Error("Rapor için hesaplamaya uygun kayıt yok.");
  }
  const unknown = collectUnknownStatuses(input.records, input.statusRules);
  if (unknown.length > 0) {
    throw new Error("Rapor oluşturulmadan önce sınıflandırılmamış durumlar tamamlanmalıdır.");
  }

  const classified: ClassifiedRecord[] = input.records.map((record) => ({
    record,
    disposition: classifyRecord(record, input.statusRules) as StatusDisposition,
  }));
  const carrierRows = new Map<string, ClassifiedRecord[]>();
  const hourlyTotals = Array.from({ length: 24 }, () => 0);
  let rejections = 0;
  let start = input.records[0].occurredAt;
  let end = input.records[0].occurredAt;

  for (const item of classified) {
    const bucket = carrierRows.get(item.record.carrier) ?? [];
    bucket.push(item);
    carrierRows.set(item.record.carrier, bucket);
    hourlyTotals[item.record.hour] += 1;
    if (item.disposition === "red") rejections += 1;
    if (item.record.occurredAt < start) start = item.record.occurredAt;
    if (item.record.occurredAt > end) end = item.record.occurredAt;
  }

  const topCarriers = [...carrierRows.entries()]
    .map(([name, rows]) => buildCarrier(name, rows))
    .sort(
      (left, right) =>
        right.registrations - left.registrations || localeSort(left.name, right.name),
    )
    .slice(0, 20)
    .map((carrier, index) => ({ ...carrier, rank: index + 1 }));

  const rootCauses = aggregateRootCauses(classified);
  const unmatchedCount = rootCauses
    .filter((cause) => !cause.matched)
    .reduce((sum, cause) => sum + cause.count, 0);
  const warnings: ReportModel["warnings"] = [];
  if (input.importSummary.invalidRows) {
    warnings.push({
      kind: "invalid-row",
      message: "Geçersiz tarih veya boş nakliyeci nedeniyle satırlar dışarıda bırakıldı.",
      count: input.importSummary.invalidRows,
    });
  }
  if (input.importSummary.warnings.length) {
    warnings.push({
      kind: "empty-field",
      message: "Bazı Poliport Terminal satırlarında boş alan bulundu.",
      count: input.importSummary.warnings.length,
    });
  }
  if (unmatchedCount) {
    warnings.push({
      kind: "unmatched-root-cause",
      message: "Standart sözlükle eşleşmeyen kök sebep açıklamaları özgün haliyle korundu.",
      count: unmatchedCount,
    });
  }
  if (topCarriers.length < 20) {
    warnings.push({
      kind: "short-ranking",
      message: "Bu dönemde 20'den az nakliyeci bulundu.",
      count: topCarriers.length,
    });
  }

  return {
    period: { start: new Date(start), end: new Date(end) },
    totals: {
      carriers: carrierRows.size,
      registrations: classified.length,
      rejections,
      rejectionRate: classified.length ? rejections / classified.length : 0,
    },
    topCarriers,
    rootCauses,
    hourlyTotals,
    importSummary: { ...input.importSummary, warnings: [...input.importSummary.warnings] },
    warnings,
  };
}
