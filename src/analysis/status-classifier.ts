import { DEFAULT_STATUS_RULES } from "@/config/status-rules";
import type {
  NormalizedRecord,
  StatusDisposition,
  StatusRuleMap,
  UnknownStatus,
} from "@/types/import";
import { normalizeForComparison } from "@/utils/text";

export function resolveStatusRule(
  status: string,
  userRules: StatusRuleMap,
): StatusDisposition | undefined {
  const normalized = normalizeForComparison(status);
  return userRules[normalized] ?? DEFAULT_STATUS_RULES[normalized];
}

export function classifyRecord(
  record: NormalizedRecord,
  userRules: StatusRuleMap,
): StatusDisposition | "unknown" {
  const normalized = normalizeForComparison(record.status);
  if (!normalized) return record.rejectionReason.trim() ? "red" : "not-red";
  return resolveStatusRule(normalized, userRules) ?? "unknown";
}

export function collectUnknownStatuses(
  records: NormalizedRecord[],
  userRules: StatusRuleMap,
): UnknownStatus[] {
  const values = new Map<string, UnknownStatus>();
  for (const record of records) {
    const normalized = normalizeForComparison(record.status);
    if (!normalized || resolveStatusRule(normalized, userRules)) continue;
    const existing = values.get(normalized);
    if (existing) existing.count += 1;
    else {
      values.set(normalized, {
        normalized,
        label: record.status.trim(),
        count: 1,
      });
    }
  }
  return [...values.values()];
}
