export function getSeverity(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : 'UNKNOWN';
  return ['CRITICAL','HIGH','MODERATE','MEDIUM','LOW'].includes(code) ? code : 'UNKNOWN';
}
export function severityLabel(value) {
  return { CRITICAL: '매우 심각', HIGH: '높음', MODERATE: '보통', MEDIUM: '보통', LOW: '낮음', UNKNOWN: '미분류' }[getSeverity(value)];
}
