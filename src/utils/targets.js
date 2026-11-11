import { getHostname } from './network.js';
export const MAX_TARGETS = 50;
export const ECOSYSTEMS = ['Maven', 'npm', 'PyPI', 'Go', 'crates.io', 'RubyGems', 'NuGet', 'Packagist'];
export function validateTarget(input) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 80) throw new Error('대상 이름을 1~80자로 입력해야 합니다.');
  if (input.type === 'website') {
    const url = typeof input.url === 'string' ? input.url.trim() : '';
    if (url.length > 2048) throw new Error('웹사이트 주소는 2048자 이하로 입력해야 합니다.');
    return { name, type: 'website', url, hostname: getHostname(url) };
  }
  if (input.type !== 'library' || !ECOSYSTEMS.includes(input.ecosystem)) throw new Error('지원하는 검사 유형과 패키지 생태계를 선택해야 합니다.');
  const packageName = typeof input.packageName === 'string' ? input.packageName.trim() : '';
  const version = typeof input.version === 'string' ? input.version.trim() : '';
  if (!packageName || packageName.length > 214 || !version || version.length > 100) throw new Error('패키지명(214자 이하)과 버전(100자 이하)을 입력해야 합니다.');
  return { name, type: 'library', ecosystem: input.ecosystem, packageName, version };
}
export function addTarget(records, input, id = crypto.randomUUID()) {
  if (records.length >= MAX_TARGETS) throw new Error(`임시 대상은 최대 ${MAX_TARGETS}개까지 등록할 수 있습니다.`);
  return [...records, { ...validateTarget(input), id }];
}
export function updateTarget(records, id, input) {
  if (!records.some((record) => record.id === id)) throw new Error('수정할 검사 대상을 찾지 못했습니다.');
  const valid = validateTarget(input);
  return records.map((record) => record.id === id ? { ...valid, id } : record);
}
export function deleteTarget(records, id) { return records.filter((record) => record.id !== id); }
export function searchTargets(records, query = '', type = 'all') {
  const q = query.trim().toLowerCase();
  return records.filter((record) => (type === 'all' || record.type === type) && [record.name,record.url,record.hostname,record.packageName,record.ecosystem,record.version].some((value) => (value || '').toLowerCase().includes(q)));
}
