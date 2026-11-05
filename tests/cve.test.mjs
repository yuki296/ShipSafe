import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCveID, parseCve, getCveDetails } from '../src/services/cve.js';
const id='CVE-2021-44228';
const fixture={totalResults:1,vulnerabilities:[{cve:{id,vulnStatus:'Analyzed',descriptions:[{lang:'en',value:'Known issue'}],metrics:{cvssMetricV31:[{type:'Secondary',source:'other',cvssData:{baseScore:9,baseSeverity:'HIGH',version:'3.1'}},{type:'Primary',source:'nvd@nist.gov',cvssData:{baseScore:10,baseSeverity:'CRITICAL',version:'3.1'}}]},configurations:[{nodes:[{cpeMatch:[{vulnerable:true,criteria:'cpe:2.3:a:apache:log4j:*:*:*:*:*:*:*:*',versionEndExcluding:'2.15.0'},{vulnerable:false,criteria:'cpe:2.3:o:vendor:os:*:*:*:*:*:*:*:*'}]}]}],references:[{url:'https://logging.apache.org/security.html'},{url:'javascript:alert(1)'}]}}]};
test('CVE identifier validation and official primary score parsing',()=>{
  assert.equal(normalizeCveID(' cve-2021-44228 '),id);
  for(const value of ['example.com','CVE-1-1234','CVE-2021-12','CVE-2021-44228&extra=x'])assert.throws(()=>normalizeCveID(value));
  const result=parseCve(fixture,id);assert.equal(result.score,10);assert.equal(result.scoreSource,'nvd@nist.gov');assert.equal(result.severity,'CRITICAL');assert.equal(result.affected.length,1);assert.match(result.affected[0].range,/미만: 2.15.0/);assert.equal(result.references.length,1);
});
test('CVE empty vs malformed response, unknown severity and rejected records',()=>{
  assert.equal(parseCve({totalResults:0,vulnerabilities:[]},id),null);
  assert.throws(()=>parseCve({},id),/형식/);assert.throws(()=>parseCve(fixture,'CVE-2021-45105'),/일치/);
  const minimal=parseCve({totalResults:1,vulnerabilities:[{cve:{id,vulnStatus:'Rejected'}}]},id);assert.equal(minimal.score,null);assert.equal(minimal.severity,'UNKNOWN');assert.equal(minimal.status,'Rejected');
});
test('CVE lookup caches successful response and rejects rapid distinct requests',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url)=>{calls++;assert.match(url,/cveId=CVE-2021-44228/);return {ok:true,json:async()=>fixture};};
  try {assert.equal((await getCveDetails(id)).id,id);assert.equal((await getCveDetails(id)).id,id);assert.equal(calls,1);await assert.rejects(getCveDetails('CVE-2021-45105'),/7초/);}finally{globalThis.fetch=original;}
});
