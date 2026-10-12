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
