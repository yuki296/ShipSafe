export const HISTORY_KEY = 'shipsafe-history';
export const MAX_HISTORY = 20;
export const MAX_HISTORY_BYTES = 200 * 1024;
const MAX_RECORD_BYTES = 8 * 1024;
const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
const strings = (value, max = 50) => Array.isArray(value) ? value.filter((x) => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 200)) : [];
const count = (value) => Number.isInteger(value) && value >= 0 ? value : null;
function snapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  // 정해진 요약 필드만 저장한다. 전체 API 본문이나 임의 URL은 저장하지 않는다.
  return {
    scope: text(value.scope, 160), originIP: null, networkError: text(value.networkError, 240),
    ips: Array.isArray(value.ips) ? value.ips.slice(0, 8).filter((row) => row && typeof row.ip === 'string').map((row) => ({
      ip: text(row.ip, 50), status: ['observed','no-data','error'].includes(row.status) ? row.status : 'error',
      provider: text(row.provider, 60), cdnStatus: row.cdnStatus === 'confirmed' ? 'confirmed' : 'unknown',
      ports: Array.isArray(row.ports) ? row.ports.filter((port) => Number.isInteger(port) && port > 0 && port <= 65535).slice(0, 50) : [],
      tags: strings(row.tags, 10), cves: strings(row.cves, 20), error: text(row.error, 240),
    })) : [],
    skipped: strings(value.skipped, 50),
    observatory: value.observatory && typeof value.observatory === 'object' ? {
      grade: text(value.observatory.grade, 5), score: typeof value.observatory.score === 'number' && Number.isFinite(value.observatory.score) ? value.observatory.score : null,
      passed: count(value.observatory.passed), failed: count(value.observatory.failed), error: text(value.observatory.error, 240),
    } : null,
    vulnerabilities: Array.isArray(value.vulnerabilities) ? value.vulnerabilities.slice(0, 50).filter((row) => row && typeof row.id === 'string').map((row) => ({ id: text(row.id, 120), severity: text(row.severity, 20) })) : [],
    truncated: true, // summary intentionally excludes full API details
  };
}
export function normalizeRecord(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !row.id ||
    typeof row.target !== 'string' || !row.target || typeof row.scannedAt !== 'string' || !Number.isFinite(Date.parse(row.scannedAt))) return null;
  const type = row.type === 'website' ? 'website' : row.type === 'library' || (!row.type && typeof row.version === 'string') ? 'library' : null;
  if (!type || (type === 'library' && typeof row.version !== 'string')) return null;
  return { id: text(row.id, 100), type, target: text(row.target, 253), version: text(row.version, 100), ecosystem: text(row.ecosystem, 40),
    vulnerabilityCount: count(row.vulnerabilityCount), portCount: count(row.portCount), scannedAt: row.scannedAt,
    name: text(row.name, 80), memo: text(row.memo, 500), snapshot: snapshot(row.snapshot), schemaVersion: 1 };
}
export function boundHistory(records) {
  const seen = new Set();
  const valid = records.map(normalizeRecord).filter((row) => row && !seen.has(row.id) && seen.add(row.id)).slice(0, MAX_HISTORY);
  for (const row of valid) if (JSON.stringify(row).length * 2 > MAX_RECORD_BYTES) {
    row.snapshot = { scope: '저장 용량 제한으로 상세 요약을 생략했습니다.', truncated: true };
  }
  while (valid.length && JSON.stringify(valid).length * 2 > MAX_HISTORY_BYTES) valid.pop();
  return valid;
}
export function readHistory(storage) {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return { records: [], warning: '' };
    if (raw.length * 2 > MAX_HISTORY_BYTES * 4) return { records: [], warning: '저장된 이력이 용량 한도를 초과해 불러오지 않았습니다.' };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('array required');
    const records = boundHistory(parsed);
    return { records, warning: records.length < parsed.length ? '일부 이력이 손상됐거나 저장 한도를 초과해 제외했습니다.' : '' };
  } catch {
    return { records: [], warning: '이력을 읽지 못했습니다. 브라우저 저장소 차단 또는 저장 데이터 손상 여부를 확인해야 합니다.' };
  }
}
export function writeHistory(storage, records) {
  const bounded = boundHistory(records);
  try { storage.setItem(HISTORY_KEY, JSON.stringify(bounded)); return { records: bounded, warning: '' }; }
  catch { return { records: bounded, warning: '이력을 브라우저에 저장하지 못했습니다. 현재 화면에서만 유지되며 새로고침하면 사라질 수 있습니다.' }; }
}
export function updateHistoryMetadata(records, id, metadata) {
  // Allowlist: 결과·대상·시각·ID는 갱신할 수 없다.
  return records.map((row) => row.id === id ? { ...row, name: text(metadata.name, 80), memo: text(metadata.memo, 500) } : row);
}
function localDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function selectHistory(records, { query = '', type = 'all', start = '', end = '', sort = 'newest' } = {}) {
  const q = query.trim().toLowerCase();
  return records.filter((row) => (type === 'all' || row.type === type) &&
    [row.target,row.name,row.memo,row.ecosystem].some((value) => (value || '').toLowerCase().includes(q)) &&
    (!start || localDate(row.scannedAt) >= start) && (!end || localDate(row.scannedAt) <= end))
    .sort((a, b) => sort === 'oldest' ? Date.parse(a.scannedAt) - Date.parse(b.scannedAt) : sort === 'target' ? a.target.localeCompare(b.target, 'ko') : Date.parse(b.scannedAt) - Date.parse(a.scannedAt));
}
export function websiteRecord(network, observatory = null, error = null) {
  return { id: crypto.randomUUID(), type: 'website', target: network.hostname, scannedAt: new Date().toISOString(),
    vulnerabilityCount: network.results.some((row) => row.status === 'observed') ? new Set(network.results.filter((row) => row.status === 'observed').flatMap((row) => row.data.vulns)).size : null,
    portCount: network.results.some((row) => row.status === 'observed') ? new Set(network.results.filter((row) => row.status === 'observed').flatMap((row) => row.data.ports)).size : null,
    snapshot: { scope: 'DNS 응답 IPv4의 공개 관측 요약 · 원본 서버 확인되지 않음', originIP: null, networkError: network.error,
      ips: network.results.map((row) => ({ ip: row.ip, status: row.status, provider: row.cdn.provider, cdnStatus: row.cdn.status, ports: row.data?.ports, tags: row.data?.tags, cves: row.data?.vulns, error: row.error })), skipped: network.skipped,
      observatory: observatory ? { grade: observatory.grade, score: observatory.score, passed: observatory.tests_passed, failed: observatory.tests_failed } : error ? { error: error.message } : null,
    } };
}
