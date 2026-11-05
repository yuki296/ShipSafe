import { requestJSON } from '../utils/http.js';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const optionalArray = (value, valid) => value === undefined || (Array.isArray(value) && value.every(valid));
function validVulnerability(row) {
  return object(row) && typeof row.id === 'string' &&
    ['summary','details'].every((key) => row[key] === undefined || typeof row[key] === 'string') &&
    optionalArray(row.aliases, (id) => typeof id === 'string') &&
    optionalArray(row.references, (ref) => object(ref) && typeof ref.url === 'string') &&
    optionalArray(row.affected, (affected) => object(affected) && (!affected.package || (object(affected.package) && ['name','ecosystem'].every((key) => typeof affected.package[key] === 'string'))) &&
      optionalArray(affected.versions, (v) => typeof v === 'string') && optionalArray(affected.ranges, (range) => object(range) && typeof range.type === 'string' && optionalArray(range.events, (event) => object(event) && Object.values(event).every((v) => typeof v === 'string'))));
}
export async function getOSVVulnerabilities(ecosystem, name, version) {
  const data = await requestJSON('https://api.osv.dev/v1/query', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version, package: { name, ecosystem } }),
  }, 'OSV', 20000);
  if (data.error || (data.vulns !== undefined && !Array.isArray(data.vulns)) || data.vulns?.some((row) => !validVulnerability(row))) throw new Error('OSV 응답 형식이 올바르지 않습니다.');
  return data.vulns ?? [];
}
