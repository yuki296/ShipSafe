import { OBSERVATORY_GROUPS, getTestPresentation } from '../src/utils/observatoryPresentation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithOxc } from 'vite';
import { getHttpRisk, getLibraryRisk } from '../src/utils/riskGuidance.js';
import { getSeverity } from '../src/utils/severity.js';
async function component(file, name, imports={}) {
  const source=readFileSync(new URL(`../src/components/${file}`,import.meta.url),'utf8')
    .replace(/^import\s[\s\S]*?;\r?\n/gm,'').replace(/export default function /g,'function ').replace(/export function /g,'function ');
  const ctx={React,OBSERVATORY_GROUPS,getTestPresentation,getSeverity,getHttpRisk,getLibraryRisk,...imports};vm.createContext(ctx);
  vm.runInContext((await transformWithOxc(source,file,{jsx:{runtime:'classic'}})).code,ctx);
  return ctx[name];
}
test('IP card distinguishes CDN observation, missing data and errors without calling origin vulnerable', async()=>{
  const Card=await component('IPResultCard.jsx','IPResultCard');
  const cdn={status:'confirmed',provider:'Cloudflare',role:'CDN·프록시 네트워크 IP',evidence:[]};
  const observed=renderToStaticMarkup(React.createElement(Card,{result:{ip:'172.66.147.243',status:'observed',cdn,data:{ports:[80],tags:['cdn'],hostnames:[],vulns:['CVE-2021-44228']},observedAt:'2026-11-05T00:00:00Z'}}));
  assert.match(observed,/원본 서버 IP/);assert.match(observed,/확인되지 않음/);assert.match(observed,/CDN·프록시 IP/);assert.match(observed,/실제 공격 가능성을 검증하지 않았습니다/);
  const missing=renderToStaticMarkup(React.createElement(Card,{result:{ip:'8.8.8.8',status:'no-data',cdn}}));assert.match(missing,/공개 관측 정보 없음/);
  const failed=renderToStaticMarkup(React.createElement(Card,{result:{ip:'8.8.8.8',status:'error',error:'HTTP 503',cdn}}));assert.match(failed,/조회 실패: HTTP 503/);assert.doesNotMatch(failed,/CVE 0개/);
});
test('severity card shows Korean unknown instead of inferring a score',async()=>{
  const Card=await component('VulnerabilityCard.jsx','VulnerabilityCard');
  const unknown=renderToStaticMarkup(React.createElement(Card,{vuln:{id:'test',severity:[{score:'CVSS:3.1/AV:N'}]}}));assert.match(unknown,/미분류/);assert.doesNotMatch(unknown,/매우 심각/);
  const high=renderToStaticMarkup(React.createElement(Card,{vuln:{id:'test',database_specific:{severity:'HIGH'}}}));assert.match(high,/높음/);
});
test('Mozilla reasons keep neutral distinct and external HTML is rendered as escaped plain text',async()=>{
  const Explain=await component('ScanExplanation.jsx','MozillaExplanation',{Icon:()=>null,IPResultCard:()=>null});
  const html=renderToStaticMarkup(React.createElement(Explain,{result:{hostname:'example.com',grade:'F',score:75,tests:{'content-security-policy':{pass:false,result:'csp-not-implemented',score_modifier:-25,score_description:'<p>Missing CSP</p><img src=x onerror=alert(1)>'},cookies:{pass:null,result:'cookies-not-found',score_modifier:0}}}}));
  assert.match(html,/허용한 코드만 불러오게/);assert.match(html,/판단하지 않음/);assert.match(html,/기본 100점/);assert.doesNotMatch(html,/<img/);assert.match(html,/Missing CSP/);
  const empty=renderToStaticMarkup(React.createElement(Explain,{result:{hostname:'example.com',grade:'A',score:95,tests:{}}}));assert.match(empty,/상세 결과를 받지 못했습니다/);
});

test('risk explanation is conditional, suppressed for passed/neutral HTTP results and unknown CVEs do not invent impacts',async()=>{
  assert.equal(getHttpRisk('content-security-policy',{pass:true}),null);
  assert.equal(getHttpRisk('content-security-policy',{pass:null}),null);
  assert.match(getHttpRisk('content-security-policy',{pass:false}),/다른 보안 문제로/);
  const unknown=getLibraryRisk({id:'new-advisory',summary:'critical issue'});assert.equal(unknown.source,undefined);assert.match(unknown.impact,/임의로 단정하지 않습니다/);
});

test('specific advisory uses verified ID and preserves denial-of-service distinction',async()=>{
  const Card=await component('VulnerabilityCard.jsx','VulnerabilityCard');
  const html=renderToStaticMarkup(React.createElement(Card,{vuln:{id:'GHSA-example',aliases:['CVE-2021-45105'],database_specific:{severity:'HIGH'}}}));
  assert.match(html,/서비스가 중단될 수 있습니다/);assert.match(html,/실제 악용 미검증/);assert.match(html,/공식 위험 설명 근거/);
});

test('plain-language results hide technical text and distinguish missing optional protection from installed protection',async()=>{
  const Explain=await component('ScanExplanation.jsx','MozillaExplanation',{Icon:()=>null,IPResultCard:()=>null});
  const html=renderToStaticMarkup(React.createElement(Explain,{result:{hostname:'example.com',grade:'F',score:0,tests:{'x-content-type-options':{pass:false,result:'x-content-type-options-not-implemented',score_modifier:-5},'cross-origin-opener-policy':{pass:true,result:'coop-not-implemented',score_modifier:0}}}}));
  assert.match(html,/MIME 타입 스니핑 방지/);assert.match(html,/MIME Sniffing Protection/);assert.match(html,/Needs Improvement/);assert.match(html,/선택 설정 없음/);assert.match(html,/설정이 있다는 뜻은 아닙니다/);
  assert.match(html,/<details class="technical-details">/);assert.doesNotMatch(html,/<details class="technical-details" open/);
});

test('HTTP checks separate optional settings from failed, passed and unassessed checks',()=>{
  assert.equal(getTestPresentation('content-security-policy',{pass:false,result:'csp-not-implemented'}).group,'improve');
  assert.equal(getTestPresentation('cross-origin-opener-policy',{pass:true,result:'coop-not-implemented'}).group,'optional');
  assert.equal(getTestPresentation('cross-origin-embedder-policy',{pass:false,result:'coep-header-invalid'}).group,'optional');
  assert.equal(getTestPresentation('cross-origin-resource-policy',{pass:null,result:'cross-origin-resource-policy-not-implemented'}).group,'optional');
  assert.equal(getTestPresentation('cross-origin-resource-sharing',{pass:true,result:'cross-origin-resource-sharing-not-implemented'}).group,'reference');
  assert.equal(getTestPresentation('cookies',{pass:null,result:'cookies-not-found'}).group,'reference');
  assert.equal(getTestPresentation('subresource-integrity',{pass:true,result:'sri-implemented-and-all-scripts-integrity-protected'}).group,'passed');
});
