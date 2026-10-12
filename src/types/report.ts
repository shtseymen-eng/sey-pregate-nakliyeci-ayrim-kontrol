import type {
  NormalizedRecord,
  StatusRuleMap,
} from "@/types/import";

export interface ReportTotals {
  carriers: number;
  registrations: number;
  rejections: number;
  rejectionRate: number;
}

export interface ProductTotal {
  name: string;
  registrations: number;
  rejections: number;
  rejectionRate: number;
}

export interface RootCauseTotal {
  label: string;
  count: number;
  matched: boolean;
}

export interface SpecialBreakdown {
  ravagoStrene: { registrations: number; rejections: number };
  other: { registrations: number; rejections: number };
}

export interface CarrierReport {
  rank: number;
  name: string;
  registrations: number;
  rejections: number;
  rejectionRate: number;
  activeDays: number;
  dailyAverage: number | null;
  products: ProductTotal[];
  hourlyTotals: number[];
  peakHour: { hour: number; count: number };
  rootCauses: RootCauseTotal[];
  topProduct: { name: string; count: number } | null;
  specialBreakdown?: SpecialBreakdown;
}

export interface ImportSummary {
  rowsRead: number;
  rowsIncluded: number;
  rowsExcludedDepartment: number;
  invalidRows: number;
  warnings: string[];
}

export interface ReportWarning {
  kind: "invalid-row" | "empty-field" | "unmatched-root-cause" | "short-ranking";
  message: string;
  count?: number;
}

export interface ReportModel {
  period: { start: Date; end: Date };
  totals: ReportTotals;
  topCarriers: CarrierReport[];
  rootCauses: RootCauseTotal[];
  hourlyTotals: number[];
  importSummary: ImportSummary;
  warnings: ReportWarning[];
}

export interface BuildReportInput {
  records: NormalizedRecord[];
  statusRules: StatusRuleMap;
  importSummary: ImportSummary;
}
