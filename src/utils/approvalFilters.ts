import type { ApprovalModuleScore } from '../api';

export function approvalKindForTypeLabel(typeLabel: string, modules: ApprovalModuleScore[]): string | undefined {
  if (typeLabel === 'All') {
    return undefined;
  }
  return modules.find((m) => m.type === typeLabel)?.kind;
}

export function approvalTypeChipsFromSummary(modules: ApprovalModuleScore[]): string[] {
  const types = modules.filter((m) => m.count > 0).map((m) => m.type);
  return ['All', ...[...new Set(types)].sort((a, b) => a.localeCompare(b))];
}
