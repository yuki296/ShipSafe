import { CDN_PROVIDERS } from '../data/cdnRanges.js';
import { inCidr } from './network.js';

export function identifyCDN(ip, { cnames = [], shodan = null } = {}) {
  const provider = CDN_PROVIDERS.find((item) => item.ranges.some((range) => inCidr(ip, range)));
  const evidence = [];
  if (provider) {
    evidence.push({ kind: 'official-range', text: `${ip} ∈ ${provider.ranges.find((range) => inCidr(ip, range))}`, source: provider.source, verifiedAt: provider.verifiedAt });
  }
  // DNS 연결 관계와 Shodan 관측은 보조 근거이며, 문자열만으로 제공자를 확정하지 않는다.
  const suffixes = ['cdn.cloudflare.net', 'fastly.net', 'fastlylb.net', 'cloudfront.net', 'edgekey.net', 'edgesuite.net', 'akamaiedge.net'];
  for (const cname of cnames) {
    if (suffixes.some((suffix) => cname === suffix || cname.endsWith(`.${suffix}`))) evidence.push({ kind: 'dns-hint', text: `DNS CNAME: ${cname} (보조 근거, 이 IP의 소유자 확정 아님)` });
  }
  if (shodan?.tags?.some((tag) => ['cdn', 'proxy', 'reverse-proxy', 'cloud'].includes(tag.toLowerCase()))) evidence.push({ kind: 'shodan-hint', text: `Shodan 태그: ${shodan.tags.join(', ')} (공개 관측의 보조 근거)` });
  if (shodan?.hostnames?.length) evidence.push({ kind: 'shodan-hostnames', text: `Shodan 호스트명: ${shodan.hostnames.slice(0, 5).join(', ')} (현재 DNS와 다를 수 있음)` });
  return { status: provider ? 'confirmed' : 'unknown', provider: provider?.name ?? null, role: provider ? 'CDN·프록시 네트워크 IP' : 'DNS 응답 IP · 역할 미확인', originIP: null, evidence };
}
