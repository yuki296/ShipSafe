import test from 'node:test';
import assert from 'node:assert/strict';
import { inCidr, isPublicIPv4, getHostname } from '../src/utils/network.js';
import { identifyCDN } from '../src/utils/cdn.js';
import { analyzeWebsite, mapLimited, MAX_IPS } from '../src/services/website.js';
import { readHistory, writeHistory, updateHistoryMetadata, selectHistory, boundHistory, HISTORY_KEY, MAX_HISTORY_BYTES, websiteRecord } from '../src/utils/history.js';
import { getDNSRecords } from '../src/services/dns.js';
import { getShodanData } from '../src/services/shodan.js';
import { getOSVVulnerabilities } from '../src/services/osv.js';
import { getMozillaScan } from '../src/services/observatory.js';
import { getSeverity } from '../src/utils/severity.js';
const observation = (ip) => ({ ip, ports: [80,443], vulns: [], tags: ['cdn'], hostnames: ['edge.example'] });
const fixture = (id = 'old', type = 'library') => ({ id, type, target: type === 'library' ? 'lodash' : 'example.com', version: type === 'library' ? '4.17.21' : '', vulnerabilityCount: 0, scannedAt: '2026-11-05T01:00:00Z' });
function storage(raw) { return { raw, getItem(key) { assert.equal(key,HISTORY_KEY); return this.raw; }, setItem(key, value) { assert.equal(key,HISTORY_KEY); this.raw=value; } }; }
async function mockedFetch(fn, action) { const original=globalThis.fetch; globalThis.fetch=fn; try { await action(); } finally { globalThis.fetch=original; } }
const response = (data, status=200) => ({ ok: status>=200&&status<300, status, json: async()=>data });

test('CIDR arithmetic includes edges, rejects lookalikes and reserved IPs', () => {
  assert.equal(inCidr('104.16.0.0','104.16.0.0/13'),true); assert.equal(inCidr('104.23.255.255','104.16.0.0/13'),true);
  assert.equal(inCidr('104.24.0.0','104.16.0.0/13'),false); assert.equal(inCidr('999.2.3.4','0.0.0.0/0'),false);
  for (const ip of ['127.0.0.1','10.0.0.1','192.168.1.1','169.254.1.1','100.64.1.1','203.0.113.1','224.1.2.3']) assert.equal(isPublicIPv4(ip),false);
  assert.equal(isPublicIPv4('8.8.8.8'),true);
});
test('CDN requires official range proof; tag/CNAME alone never confirms origin or provider', () => {
  const cf=identifyCDN('172.66.147.243',{cnames:['foo.cdn.cloudflare.net'],shodan:observation('172.66.147.243')});
  assert.equal(cf.status,'confirmed');assert.equal(cf.provider,'Cloudflare');assert.equal(cf.originIP,null);assert.equal(cf.evidence[0].kind,'official-range');
  assert.equal(identifyCDN('151.101.1.69').provider,'Fastly');
  const unknown=identifyCDN('8.8.8.8',{cnames:['x.cloudfront.net'],shodan:{tags:['cdn'],hostnames:['cloudflare.fake']}});
  assert.equal(unknown.status,'unknown');assert.equal(unknown.provider,null);assert.equal(unknown.originIP,null);assert.ok(unknown.evidence.length);
});
test('input normalization rejects private names, credentials, ports and IP literals', () => {
  assert.equal(getHostname(' https://EXAMPLE.com/path?q=a '),'example.com');
  for(const input of ['', 'ftp://example.com','https://user:pass@example.com','localhost','thing.local','http://127.0.0.1','example.com:8080','example..com']) assert.throws(()=>getHostname(input));
});
test('multiple IPs preserve errors/no-data independently, cap 8 and concurrency 2', async () => {
  let active=0, peak=0, called=0;
  const ips=Array.from({length:10},(_,i)=>`8.8.8.${i+1}`);
  const network=await analyzeWebsite('example.com',{dns:async()=>({addresses:ips,cnames:[]}),shodan:async(ip)=>{
    called++;active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,2));active--;
    if(ip===ips[1])throw Error('HTTP 429');if(ip===ips[2])return null;return observation(ip);
  }});
  assert.equal(called,MAX_IPS);assert.equal(peak,2);assert.equal(network.results[1].status,'error');assert.equal(network.results[2].status,'no-data');assert.equal(network.results[0].status,'observed');assert.equal(network.skipped.length,2);
  const reserved=await analyzeWebsite('example.com',{dns:async()=>({addresses:['127.0.0.1'],cnames:[]}),shodan:async()=>{throw Error('must not be called');}});assert.match(reserved.results[0].error,/내부/);
  assert.deepEqual(await mapLimited([],2,()=>null),[]);
});
test('history migrates legacy key, survives reload, supports metadata-only update/search/type/date/sort/delete', () => {
  const legacy=fixture();delete legacy.type;
  const store=storage(JSON.stringify([legacy,null,{}]));let state=readHistory(store);assert.equal(state.records.length,1);assert.ok(state.warning);
  const website=fixture('website','website');state=writeHistory(store,[website,...state.records]);
  state=readHistory(store);assert.equal(state.records.length,2);
  const before=JSON.stringify(state.records[0]);const changed=updateHistoryMetadata(state.records,'website',{name:'내 사이트',memo:'발표 테스트',target:'evil.com',vulnerabilityCount:999});
  assert.equal(changed[0].target,'example.com');assert.equal(changed[0].vulnerabilityCount,0);assert.equal(changed[0].scannedAt,state.records[0].scannedAt);assert.equal(JSON.stringify(state.records[0]),before);
  writeHistory(store,changed);assert.equal(readHistory(store).records[0].memo,'발표 테스트');
  assert.equal(selectHistory(changed,{query:'발표',type:'website',start:'2026-11-05',end:'2026-11-05'}).length,1);
  assert.equal(selectHistory(changed,{query:'lodash',type:'library'}).length,1);assert.equal(selectHistory(changed,{start:'2026-12-01'}).length,0);
  writeHistory(store,changed.filter(row=>row.id!=='website'));assert.equal(readHistory(store).records.length,1);writeHistory(store,[]);assert.equal(readHistory(store).records.length,0);
});
test('storage corruption, unavailable storage, size budget, deduplication and quota failure', () => {
  assert.ok(readHistory(storage('{')).warning);assert.ok(readHistory(null).warning);
  assert.ok(writeHistory({setItem(){throw Error('quota');}},[fixture()]).warning);
  const rows=Array.from({length:30},(_,i)=>({...fixture(String(i)),memo:'x'.repeat(10000),snapshot:{ips:Array.from({length:8},(_,i)=>({ip:`8.8.8.${i}`,tags:['x'.repeat(10000)],cves:['x'.repeat(10000)],ports:[443]}))}}));
  const bounded=boundHistory(rows);assert.equal(bounded.length,20);assert.ok(JSON.stringify(bounded).length*2<=MAX_HISTORY_BYTES);assert.equal(bounded[0].memo.length,500);
  assert.equal(boundHistory([fixture(),fixture()]).length,1);
});
test('unknown counts remain unknown in website history, partial results retain exact scope', () => {
  const none=websiteRecord({hostname:'example.com',results:[{ip:'8.8.8.8',cdn:identifyCDN('8.8.8.8'),status:'error',error:'HTTP 503'}],skipped:[]});assert.equal(none.portCount,null);assert.equal(none.vulnerabilityCount,null);
  const store=storage();writeHistory(store,[none]);assert.equal(readHistory(store).records[0].snapshot.ips[0].status,'error');
});
test('API DNS empty vs malformed/NXDOMAIN and timeout distinction', async () => {
  await mockedFetch(async()=>response({Status:0,Answer:[{type:1,data:'8.8.8.8'},{type:1,data:'8.8.8.8'},{type:5,data:'foo.fastly.net.'}]}),async()=>{const r=await getDNSRecords('example.com');assert.deepEqual(r.addresses,['8.8.8.8']);assert.deepEqual(r.cnames,['foo.fastly.net']);});
  await mockedFetch(async()=>response({Status:0}),async()=>assert.deepEqual((await getDNSRecords('example.com')).addresses,[]));
  await mockedFetch(async()=>response({Status:3}),async()=>assert.rejects(getDNSRecords('missing.example'),/NXDOMAIN/));
  await mockedFetch(async()=>response({}),async()=>assert.rejects(getDNSRecords('example.com'),/상태/));
  await mockedFetch(async()=>{throw new DOMException('timeout','TimeoutError');},async()=>assert.rejects(getDNSRecords('example.com'),/초과/));
});
test('Shodan 404 is no-data, 503 and malformed payload are errors', async () => {
  await mockedFetch(async()=>response({},404),async()=>assert.equal(await getShodanData('8.8.4.1'),null));
  await mockedFetch(async()=>response({},503),async()=>assert.rejects(getShodanData('8.8.4.2'),/503/));
  await mockedFetch(async()=>response({ports:[]}),async()=>assert.rejects(getShodanData('8.8.4.3'),/형식|필드/));
});
test('OSV empty vs error and missing severity never guessed', async () => {
  await mockedFetch(async()=>response({}),async()=>assert.deepEqual(await getOSVVulnerabilities('npm','lodash','4.17.21'),[]));
  await mockedFetch(async()=>response({vulns:[{id:'OSV-test',aliases:[42]}]}),async()=>assert.rejects(getOSVVulnerabilities('npm','a','1'),/형식/));
  await mockedFetch(async()=>response({},429),async()=>assert.rejects(getOSVVulnerabilities('npm','a','1'),/429/));
  assert.equal(getSeverity(null),'UNKNOWN');assert.equal(getSeverity('CVSS:3.1/AV:N'),'UNKNOWN');assert.equal(getSeverity(' HIGH '),'HIGH');
});
test('Mozilla details and fallback maintain actual score, fail malformed success', async () => {
  await mockedFetch(async()=>response({scan:{grade:'F',score:0},tests:{cookies:{pass:null,score_modifier:0}}}),async()=>{const data=await getMozillaScan('example.com');assert.equal(data.score,0);assert.equal(data.tests.cookies.pass,null);});
  let n=0;await mockedFetch(async()=>++n===1?response({},404):response({grade:'A',score:95}),async()=>assert.equal((await getMozillaScan('example.com')).detailUnavailable,true));
  await mockedFetch(async()=>response({scan:{}}),async()=>assert.rejects(getMozillaScan('example.com'),/형식/));
  await mockedFetch(async()=>response({message:'Cannot resolve'},422),async()=>assert.rejects(getMozillaScan('example.com'),e=>e.status===422&&e.detail==='Cannot resolve'));
});

test('history sorting respects chronological direction and target ordering', () => {
  const newer={...fixture('new'),target:'zebra',scannedAt:'2026-11-06T01:00:00Z'};
  const older={...fixture('old'),target:'alpha',scannedAt:'2026-11-04T01:00:00Z'};
  assert.equal(selectHistory([older,newer],{sort:'newest'})[0].id,'new');
  assert.equal(selectHistory([older,newer],{sort:'oldest'})[0].id,'old');
  assert.equal(selectHistory([newer,older],{sort:'target'})[0].target,'alpha');
});
