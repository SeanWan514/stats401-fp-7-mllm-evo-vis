import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {normalized,pairScores,protocolGroups,eligible,concernCount} from '../explorer-core.mjs';
const data=JSON.parse(readFileSync(new URL('../data/final/explorer_data.json',import.meta.url)));
const m={range_min:0,range_max:100};
test('missing and ambiguous scores never become zero',()=>{
  for(const r of [null,{}, {score:null},{score:undefined},{score:NaN},{score:105},{score:-1},{score:50,ambiguous:true}]) assert.equal(normalized(r,m),null);
  assert.equal(normalized({score:0},m),0);
  assert.equal(normalized({score:50},m),.5);
  assert.equal(normalized({score:20},{...m,higher_is_better:false}),.8);
});
test('parameter cap excludes unknown; license and family filters are exact',()=>{
  const model={open_weight:true,parameters_total_b:7,family_id:'a',license:'apache-2.0'};
  assert.ok(eligible(model,{max:'10'})); assert.ok(!eligible(model,{max:'4'}));
  assert.ok(!eligible({...model,parameters_total_b:null},{max:'10'}));
  assert.ok(!eligible(model,{family:'b'}));assert.ok(!eligible(model,{license:'mit'}));
});
test('counts reconcile with full unique public records',()=>{
  const repos=readFileSync(new URL('../data/final/repositories.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
  const comments=gunzipSync(readFileSync(new URL('../data/final/feedback.jsonl.gz',import.meta.url))).toString().trim().split('\n').map(JSON.parse);
  assert.equal(repos.length,18255);assert.equal(comments.length,21674);
  assert.equal(new Set(comments.map(r=>r.id)).size,comments.length);
  assert.equal(new Set(repos.map(r=>r.id??r.repo_id)).size,repos.length);
  assert.equal(data.counts.feedback,comments.length);assert.equal(data.counts.repositories,repos.length);
  assert.equal(data.growth.repository_creation.reduce((n,r)=>n+r.count,0),repos.length);
});
test('default pair has eight shared-group benchmark measurements',()=>{
  const [a,b]=data.radar_defaults.pair;
  for(const metric of data.metrics){const p=pairScores(data,a,b,metric.id,data.radar_defaults.groups[metric.id]);assert.ok(p.a&&p.b,metric.id);assert.equal(p.a.comparability_group,p.b.comparability_group);}
});
test('concern radar keeps practical axes unmeasured',()=>{
  assert.equal(data.radar_concerns.length,8);
  const axes=data.radar_concerns.map(id=>data.concerns.find(c=>c.id===id));
  assert.equal(axes.filter(c=>c.benchmark_id).length,6);
  assert.deepEqual(axes.filter(c=>!c.benchmark_id).map(c=>c.id),['latency','memory']);
  axes.forEach(c=>assert.ok(concernCount(data,c.id)>0));
});
test('concern counts respect source filters and overlapping categories',()=>{
  for(const c of data.concerns){assert.equal(concernCount(data,c.id),concernCount(data,c.id,{platform:'github'})+concernCount(data,c.id,{platform:'huggingface'}));assert.ok(concernCount(data,c.id)<=data.counts.feedback);assert.ok(concernCount(data,c.id,{experience:'experience'})<=concernCount(data,c.id));}
});
test('comparisons cannot silently mix source groups',()=>{
  const sample={metrics:[{id:'x',...m}],scores:[{model_id:'a',benchmark_id:'x',score:80,comparability_group:'p'},{model_id:'b',benchmark_id:'x',score:90,comparability_group:'q'}]};
  const p=pairScores(sample,'a','b','x');assert.equal(p.a,null);assert.equal(p.b,null);assert.equal(p.shared.length,0);
  assert.equal(pairScores(sample,'a','b','x','p').b,null);
});
test('all benchmark selections expose source evidence',()=>{
  for(const metric of data.metrics)for(const group of protocolGroups(data,metric.id)){
    assert.ok(group.row.source_urls.length>0);assert.ok(group.models.size>0);
    assert.ok(group.row.source_urls.every(u=>/^https?:\/\//.test(u)));
  }
});
test('all task mappings refer to known benchmark definitions',()=>{
  for(const task of data.tasks)for(const id of task.benchmark_ids)assert.ok(data.metrics.some(m=>m.id===id));
  assert.equal(new Set(data.models.map(m=>m.id)).size,57);
});
test('page has five unique view anchors and no duplicate DOM ids',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  for(const id of ['growth','tasks','evolution','radar','matrix'])assert.ok(ids.includes(id));
  assert.ok(html.includes('Completed formative review'));assert.ok(html.includes('vendor/d3.v7.min.js'));
});
