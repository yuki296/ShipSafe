import { useRef, useState } from 'react';
import { getHostname } from '../utils/network.js';
import { getDNSRecords } from '../services/dns.js';
import { getShodanData } from '../services/shodan.js';
import { getMozillaScan } from '../services/observatory.js';
import { analyzeWebsite, summarizeNetwork } from '../services/website.js';
import { websiteRecord } from '../utils/history.js';
const COOLDOWN = 10000;
export default function useWebsiteScan(addRecord) {
  const [domain, setDomain] = useState('');
  const [network, setNetwork] = useState(null);
  const [observatory, setObservatory] = useState(null);
  const [mozillaError, setMozillaError] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const requests = useRef(new Map());
  async function run(kind) {
    if (lock.current) return;
    let hostname;
    try { hostname = getHostname(domain); }
    catch (error) { setStatus(error.message); return; }
    const key = `${kind}:${hostname}`;
    if (Date.now() - (requests.current.get(key) || 0) < COOLDOWN) { setStatus('연속 요청을 줄이기 위해 같은 검사는 10초 후 다시 실행해 주세요.'); return; }
    requests.current.set(key, Date.now());
    if (requests.current.size > 40) requests.current.delete(requests.current.keys().next().value);
    lock.current = true;
    setBusy(true);
    setStatus(kind === 'mozilla' ? 'Mozilla HTTP 보안 설정 검사 중…' : '공개 네트워크 정보 조회 중…');
    // 다른 대상의 결과가 섞이지 않도록 대상을 명시하고 초기화한다.
    if (kind !== 'mozilla' || network?.hostname !== hostname) setNetwork(null);
    if (kind !== 'dns') { setObservatory(null); setMozillaError(null); }
    else if (observatory?.hostname !== hostname) { setObservatory(null); setMozillaError(null); }
    try {
      if (kind === 'mozilla') {
        try {
          const data = await getMozillaScan(hostname);
          setObservatory(data);
          const recordNetwork = network?.hostname === hostname ? network : { hostname, results: [], skipped: [] };
          addRecord(websiteRecord(recordNetwork, data));
          setStatus(`Mozilla HTTP 설정 평가: ${data.grade ?? '등급 미제공'} / ${data.score ?? '점수 미제공'}점`);
        } catch (error) { setMozillaError({ message: error.message, detail: error.detail }); setStatus(`Mozilla 검사 실패: ${error.message}`); }
      } else if (kind === 'dns') {
        const records = await getDNSRecords(hostname);
        const data = { hostname, ...records, results: [], skipped: [], scannedAt: new Date().toISOString(), dnsOnly: true };
        setNetwork(data);
        setStatus(records.addresses.length ? `DNS 응답 IPv4 ${records.addresses.length}개 (Shodan 미실행)` : 'DNS 응답에 IPv4 주소가 없습니다. IPv6는 지원하지 않습니다.');
        addRecord(websiteRecord(data));
      } else if (kind === 'shodan-test') {
        const ip = '172.66.147.243';
        const data = await getShodanData(ip);
        setStatus(data ? `개발용 고정 IP ${ip}: 공개 관측 포트 ${data.ports.length}개 / CVE ${data.vulns.length}개 (입력 도메인의 결과 아님)` : `개발용 고정 IP ${ip}: 공개 관측 정보 없음`);
      } else {
        // 개별 API 실패를 독립적으로 처리하여 성공한 결과를 유지한다.
        const [net, mozilla] = await Promise.allSettled([analyzeWebsite(hostname), getMozillaScan(hostname)]);
        const netData = net.status === 'fulfilled' ? net.value : { hostname, addresses: [], results: [], skipped: [], error: net.reason.message, scannedAt: new Date().toISOString() };
        setNetwork(netData);
        const mozillaData = mozilla.status === 'fulfilled' ? mozilla.value : null;
        const mozillaErr = mozilla.status === 'rejected' ? { message: mozilla.reason.message, detail: mozilla.reason.detail } : null;
        setObservatory(mozillaData); setMozillaError(mozillaErr);
        addRecord(websiteRecord(netData, mozillaData, mozillaErr));
        const summary = summarizeNetwork(netData);
        setStatus(`${hostname} 조회 완료 · IP 관측 ${summary.observed}개 / 정보 없음 ${summary.empty}개 / 실패 ${summary.errors}개${netData.error ? ` · DNS 실패: ${netData.error}` : ''}${!netData.error && !netData.addresses.length ? ' · IPv4 응답 없음' : ''}${mozillaErr ? ' · Mozilla 실패 (상세 이유 참고)' : ' · HTTP 설정 평가 완료'}`);
      }
    } catch (error) { setStatus(`조회 실패: ${error.message}`); }
    finally { lock.current = false; setBusy(false); }
  }
  return { domain, setDomain, network, observatory, mozillaError, status, busy, run,
    ips: network?.addresses || [], summary: summarizeNetwork(network) };
}
