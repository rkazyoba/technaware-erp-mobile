/** Compact labels for bar chart values (fits above narrow columns). */
export function formatChartValue(
  n: number,
  mode: 'number' | 'money' = 'number',
): string {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);

  const compact = (value: number, suffix: string) => {
    const digits = value >= 10 ? 0 : 1;
    return `${sign}${value.toFixed(digits)}${suffix}`;
  };

  if (abs >= 1_000_000_000) {
    return compact(abs / 1_000_000_000, 'B');
  }
  if (abs >= 1_000_000) {
    return compact(abs / 1_000_000, 'M');
  }
  if (abs >= 10_000) {
    return compact(abs / 1_000, 'k');
  }

  if (mode === 'money') {
    return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  if (abs >= 1_000) {
    return compact(abs / 1_000, 'k');
  }

  return `${sign}${abs.toLocaleString('en-US', { maximumFractionDigits: abs < 10 ? 1 : 0 })}`;
}
