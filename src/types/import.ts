export interface NormalizedRecord {
  sourceRow: number;
  occurredAt: Date;
  hour: number;
  department: string;
  carrier: string;
  product: string;
  status: string;
  rejectionReason: string;
  customer?: string;
}

export interface DepartmentFilterSummary {
  rowsRead: number;
  rowsIncluded: number;
  rowsExcludedDepartment: number;
}

export interface DepartmentFilterResult {
  records: NormalizedRecord[];
  summary: DepartmentFilterSummary;
}

export type SemanticField =
  | "date"
  | "time"
  | "department"
  | "carrier"
  | "product"
  | "status"
  | "rejectionReason"
  | "customer";

export interface ColumnMapping {
  date: number;
  time?: number;
  department: number;
  carrier: number;
  product: number;
  status: number;
  rejectionReason: number;
  customer?: number;
}

export interface MappingSuggestion {
  mapping: Partial<ColumnMapping>;
  confidence: Partial<Record<SemanticField, number>>;
  missingFields: SemanticField[];
  requiresUserMapping: boolean;
}

export interface InvalidRow {
  sourceRow: number;
  reason: string;
}

export interface NormalizationResult {
  records: NormalizedRecord[];
  invalidRows: InvalidRow[];
  warnings: string[];
  blockingErrors: string[];
  departmentSummary: DepartmentFilterSummary;
}

export interface WorkbookCandidate {
  sheetName: string;
  headerRowNumber: number;
  headers: string[];
  rows: unknown[][];
  suggestion: MappingSuggestion;
}
