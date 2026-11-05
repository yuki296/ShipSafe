import { getDNSRecords } from './dns.js';
import { getShodanData } from './shodan.js';
import { identifyCDN } from '../utils/cdn.js';
import { isPublicIPv4 } from '../utils/network.js';
export const MAX_IPS = 8;
export const IP_CONCURRENCY = 2;
export async function mapLimited(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) { const i = next++; results[i] = await task(items[i], i); }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker));
  return results;
}
export async function analyzeWebsite(hostname, { dns = getDNSRecords, shodan = getShodanData } = {}) {
  const records = await dns(hostname);
  const selected = records.addresses.slice(0, MAX_IPS);
  const results = await mapLimited(selected, IP_CONCURRENCY, async (ip) => {
    const base = { ip, cdn: identifyCDN(ip, records) };
    if (!isPublicIPv4(ip)) return { ...base, status: 'error', error: '내부·예약 IP이므로 외부 API로 전송하지 않습니다.', data: null };
    try {
      const data = await shodan(ip);
      return { ...base, cdn: identifyCDN(ip, { ...records, shodan: data }), status: data === null ? 'no-data' : 'observed', data, observedAt: new Date().toISOString() };
    } catch (error) { return { ...base, status: 'error', error: error.message, data: null }; }
  });
  return { hostname, ...records, results, skipped: records.addresses.slice(MAX_IPS), scannedAt: new Date().toISOString(), originIP: null };
}
export function summarizeNetwork(network) {
  const observed = network?.results?.filter((row) => row.status === 'observed') || [];
  return {
    ports: [...new Set(observed.flatMap((row) => row.data.ports))],
    vulns: [...new Set(observed.flatMap((row) => row.data.vulns))],
    observed: observed.length, errors: network?.results?.filter((row) => row.status === 'error').length || 0,
    empty: network?.results?.filter((row) => row.status === 'no-data').length || 0,
    cdn: network?.results?.filter((row) => row.cdn.status === 'confirmed').length || 0,
  };
}
