export function ipv4Number(ip) {
  if (typeof ip !== 'string' || !/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(ip)) return null;
  const parts = ip.split('.').map(Number);
  return parts.some((part) => part > 255) ? null : parts.reduce((n, part) => n * 256 + part, 0);
}
export function inCidr(ip, cidr) {
  const [base, prefixText] = cidr.split('/');
  const n = ipv4Number(ip), b = ipv4Number(base), prefix = Number(prefixText);
  if (n === null || b === null || !/^\d+$/.test(prefixText || '') || prefix < 0 || prefix > 32) return false;
  const block = 2 ** (32 - prefix);
  return Math.floor(n / block) === Math.floor(b / block);
}
export function isPublicIPv4(ip) {
  return ipv4Number(ip) !== null && !['0.0.0.0/8','10.0.0.0/8','100.64.0.0/10','127.0.0.0/8','169.254.0.0/16','172.16.0.0/12','192.0.0.0/24','192.0.2.0/24','192.168.0.0/16','198.18.0.0/15','198.51.100.0/24','203.0.113.0/24','224.0.0.0/3'].some((cidr) => inCidr(ip, cidr));
}
export function getHostname(input) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('웹사이트 주소를 입력해야 합니다.');
  let url;
  try { url = new URL(input.includes('://') ? input.trim() : `https://${input.trim()}`); }
  catch (error) { throw new Error('올바른 웹사이트 주소를 입력해야 합니다.', { cause: error }); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.hostname.length > 253 || !url.hostname.includes('.') ||
    !url.hostname.split('.').every((label) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label)) ||
    url.hostname.endsWith('.local') || url.hostname.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
    throw new Error('공개 도메인 주소를 입력해야 합니다. IP·인증정보·별도 포트·내부 도메인은 지원하지 않습니다.');
  }
  return url.hostname.toLowerCase();
}
