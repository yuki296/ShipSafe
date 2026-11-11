import { requestJSON } from '../utils/http.js';
import { getSeverity } from '../utils/severity.js';
const cache = new Map();
let lastRequest = -Infinity;
let pending = false;
export function normalizeCveID(input) {
  const id = typeof input === 'string' ? input.trim().toUpperCase() : '';
  if (!/^CVE-\d{4}-\d{4,}$/.test(id) || id.length > 40) throw new Error('CVE-연도-번호 형식으로 입력해야 합니다.');
  return id;
}
export function parseCve(data, id) {
  if (!Number.isInteger(data.totalResults) || !Array.isArray(data.vulnerabilities)) throw new Error('NVD 응답 형식이 올바르지 않습니다.');
  if (data.totalResults === 0 && data.vulnerabilities.length === 0) return null;
  const cve = data.vulnerabilities.find((entry) => entry?.cve?.id === id)?.cve;
  if (!cve) throw new Error('요청한 CVE와 일치하는 NVD 결과를 받지 못했습니다.');
  const metrics = cve.metrics || {};
  let metric;
  for (const key of ['cvssMetricV40', 'cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2']) {
    if (!Array.isArray(metrics[key])) continue;
    const candidates = metrics[key].filter((entry) => entry?.cvssData && typeof entry.cvssData.baseScore === 'number' && entry.cvssData.baseScore >= 0 && entry.cvssData.baseScore <= 10);
    metric = candidates.find((entry) => entry.type === 'Primary') || candidates[0];
    if (metric) break;
  }
  const affected = [];
  function visit(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (Array.isArray(node?.cpeMatch)) for (const match of node.cpeMatch) {
        if (match?.vulnerable === true && typeof match.criteria === 'string' && affected.length < 20) affected.push({
          criteria: match.criteria,
          range: ['versionStartIncluding','versionStartExcluding','versionEndIncluding','versionEndExcluding'].filter((key) => typeof match[key] === 'string').map((key) => `${({versionStartIncluding:'이상',versionStartExcluding:'초과',versionEndIncluding:'이하',versionEndExcluding:'미만'})[key]}: ${match[key]}`).join(' / '),
        });
      }
      visit(node?.nodes);
    }
  }
  if (Array.isArray(cve.configurations)) for (const config of cve.configurations) visit(config.nodes);
  const descriptions = Array.isArray(cve.descriptions) ? cve.descriptions : [];
  const ko = descriptions.find((entry) => entry?.lang === 'ko' && typeof entry.value === 'string');
  const english = descriptions.find((entry) => entry?.lang === 'en' && typeof entry.value === 'string');
  return { id, status: typeof cve.vulnStatus === 'string' ? cve.vulnStatus : '미제공',
    description: ko?.value || english?.value || '제공된 설명이 없습니다.', descriptionLanguage: ko ? 'ko' : 'en',
    severity: getSeverity(metric?.cvssData.baseSeverity || metric?.baseSeverity), score: metric?.cvssData.baseScore ?? null,
    scoreSource: metric?.source || null, scoreVersion: metric?.cvssData.version || null,
    affected, references: (Array.isArray(cve.references) ? cve.references : []).filter((ref) => typeof ref?.url === 'string' && ref.url.startsWith('https://')).slice(0, 5).map((ref) => ref.url),
    published: cve.published, modified: cve.lastModified,
  };
}
export async function getCveDetails(input) {
  const id = normalizeCveID(input);
  const saved = cache.get(id);
  if (saved && Date.now() - saved.at < 10 * 60 * 1000) return saved.value;
  if (pending || Date.now() - lastRequest < 7000) throw new Error('NVD 요청 제한을 줄이기 위해 약 7초 후 다시 조회할 수 있습니다.');
  lastRequest = Date.now(); pending = true;
  try {
    const data = await requestJSON(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(id)}`, {}, 'NVD CVE', 20000);
    const value = parseCve(data, id);
    if (cache.size >= 30) cache.delete(cache.keys().next().value);
    cache.set(id, { at: Date.now(), value });
    return value;
  } finally { pending = false; }
}
