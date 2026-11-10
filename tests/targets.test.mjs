import test from 'node:test';
import assert from 'node:assert/strict';
import { addTarget, updateTarget, deleteTarget, searchTargets, validateTarget, MAX_TARGETS } from '../src/utils/targets.js';
const web={name:' 내 사이트 ',type:'website',url:'https://EXAMPLE.com/page'};
const pkg={name:'프로젝트 패키지',type:'library',ecosystem:'npm',packageName:' lodash ',version:' 4.17.21 '};
test('temporary targets create both types and normalize fields without changing original records',()=>{
  const original=[];const first=addTarget(original,web,'web');const both=addTarget(first,pkg,'pkg');
  assert.equal(original.length,0);assert.equal(first.length,1);assert.equal(both.length,2);assert.equal(both[0].hostname,'example.com');assert.equal(both[0].name,'내 사이트');assert.equal(both[1].packageName,'lodash');assert.equal(both[1].version,'4.17.21');
});
test('target update changes only selected ID and supports type changes; delete preserves other records',()=>{
  const list=addTarget(addTarget([],web,'web'),pkg,'pkg');const updated=updateTarget(list,'web',{...web,name:'새 이름',url:'https://example.org'});
  assert.equal(updated[0].id,'web');assert.equal(updated[0].hostname,'example.org');assert.equal(list[0].hostname,'example.com');assert.deepEqual(updated[1],list[1]);
  const switched=updateTarget(updated,'web',pkg);assert.equal(switched[0].type,'library');assert.equal(switched[0].url,undefined);assert.deepEqual(deleteTarget(switched,'web'),[list[1]]);assert.throws(()=>updateTarget(list,'missing',web));
});
test('target search matches name/address/package and combines type filters',()=>{
  const list=addTarget(addTarget([],web,'web'),pkg,'pkg');assert.equal(searchTargets(list,'EXAMPLE.COM').length,1);assert.equal(searchTargets(list,'프로젝트').length,1);assert.equal(searchTargets(list,'lodash','library').length,1);assert.equal(searchTargets(list,'lodash','website').length,0);assert.equal(searchTargets(list,'','library').length,1);
});
test('invalid target fields are rejected and list is bounded',()=>{
  for(const input of [{...web,name:' '},{...web,url:'javascript:alert(1)'},{...web,url:'http://localhost'},{...pkg,version:''},{...pkg,ecosystem:'unknown'},{...pkg,type:'unknown'}]) assert.throws(()=>validateTarget(input));
  const full=Array.from({length:MAX_TARGETS},(_,i)=>({...validateTarget(web),id:String(i)}));assert.throws(()=>addTarget(full,web),/최대/);
});
