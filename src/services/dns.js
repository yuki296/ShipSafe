import { requestJSON } from '../utils/http.js';
import { ipv4Number } from '../utils/network.js';
export async function getDNSRecords(hostname) {
  const data = await requestJSON(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`, {}, 'DNS');
  if (!Number.isInteger(data.Status)) throw new Error('DNS 응답에 상태 정보가 없습니다.');
  if (data.Status !== 0) throw new Error(data.Status === 3 ? 'DNS에 등록된 도메인을 찾지 못했습니다 (NXDOMAIN).' : `DNS 조회 오류: ${data.Status}`);
  if (data.Answer !== undefined && !Array.isArray(data.Answer)) throw new Error('DNS 응답 형식이 올바르지 않습니다.');
  const answers = data.Answer || [];
  if (answers.some((row) => row?.type === 1 && ipv4Number(row.data) === null)) throw new Error('DNS IPv4 응답 값이 올바르지 않습니다.');
  const addresses = [...new Set(answers.filter((row) => row?.type === 1 && ipv4Number(row.data) !== null).map((row) => row.data))];
  const cnames = [...new Set(answers.filter((row) => row?.type === 5 && typeof row.data === 'string').map((row) => row.data.toLowerCase().replace(/\.$/, '')))];
  return { addresses, cnames, queriedAt: new Date().toISOString() };
}
export async function getIPv4Addresses(hostname) { return (await getDNSRecords(hostname)).addresses; }
