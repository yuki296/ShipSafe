import { requestJSON } from '../utils/http.js';
import { isPublicIPv4 } from '../utils/network.js';
const cache = new Map();
const TTL = 5 * 60 * 1000;
export async function getShodanData(ip) {
  if (!isPublicIPv4(ip)) throw new Error('공개 IPv4 주소만 조회할 수 있습니다.');
  const saved = cache.get(ip);
  if (saved && Date.now() - saved.at < TTL) return saved.value;
  try {
    const data = await requestJSON(`https://internetdb.shodan.io/${encodeURIComponent(ip)}`, {}, 'Shodan');
    if (data.ip !== ip || !Array.isArray(data.ports) || !Array.isArray(data.vulns) || !Array.isArray(data.tags) || !Array.isArray(data.hostnames)) throw new Error('Shodan 응답 필드가 올바르지 않습니다.');
    if (data.ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65535) || ['vulns','tags','hostnames'].some((key) => data[key].some((item) => typeof item !== 'string'))) throw new Error('Shodan 응답 값이 올바르지 않습니다.');
    if (cache.size >= 64) cache.delete(cache.keys().next().value);
    cache.set(ip, { at: Date.now(), value: data });
    return data;
  } catch (error) {
    if (error.status !== 404) throw error;
    if (cache.size >= 64) cache.delete(cache.keys().next().value);
    cache.set(ip, { at: Date.now(), value: null });
    return null;
  }
}
