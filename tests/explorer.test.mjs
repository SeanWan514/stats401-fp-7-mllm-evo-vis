import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {normalized,available,pairScores,protocolGroups,eligible,concernCount,sharedCoverage,comparisonChoices,bestComparisonPartner,paretoFrontier} from '../explorer-core.mjs';
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
test('shared coverage counts valid dimensions once, not mismatched or missing scores',()=>{
  const sample={metrics:['x','y','z','w'].map(id=>({id,...m})),scores:[
    {model_id:'a',benchmark_id:'x',score:0,comparability_group:'shared'},
    {model_id:'a',benchmark_id:'x',score:0,comparability_group:'shared'},
    {model_id:'b',benchmark_id:'x',score:75,comparability_group:'shared'},
    {model_id:'a',benchmark_id:'y',score:80,comparability_group:'p'},
    {model_id:'b',benchmark_id:'y',score:90,comparability_group:'q'},
    {model_id:'a',benchmark_id:'z',score:50,comparability_group:'shared'},
    {model_id:'b',benchmark_id:'z',score:null,comparability_group:'shared'},
    {model_id:'a',benchmark_id:'w',score:60,comparability_group:'shared'},
    {model_id:'b',benchmark_id:'w',score:70,ambiguous:true,comparability_group:'shared'}
  ]};
  assert.equal(sharedCoverage(sample,'a','b'),1);
  assert.equal(sharedCoverage(sample,'a','b',['x','x','unknown']),1);
  assert.equal(sharedCoverage(sample,'a','b',['y','z','w']),0);
  assert.equal(sharedCoverage(sample,'a','a'),0);
  assert.equal(sharedCoverage(sample,'a','missing'),0);
  assert.deepEqual(pairScores(sample,'a','b','x').shared,['shared']);
});
test('comparison choices exclude weak pairs and have stable coverage/name ordering',()=>{
  const sample={models:[{id:'a',name:'Anchor'},{id:'z',name:'Zulu'},{id:'b',name:'Alpha'},{id:'c',name:'Charlie'},{id:'d',name:'No evidence'}],metrics:['x','y','z','w'].map(id=>({id,...m})),scores:[]};
  for(const [id,n] of [['a',4],['z',4],['b',4],['c',3]])for(const metric of sample.metrics.slice(0,n))sample.scores.push({model_id:id,benchmark_id:metric.id,score:80,comparability_group:metric.id});
  assert.deepEqual(comparisonChoices(sample,'a').map(m=>m.id),['b','z','c']);
  assert.equal(bestComparisonPartner(sample,'a'),sample.models[2]);
  assert.deepEqual(comparisonChoices(sample,'a',undefined,4).map(m=>m.id),['b','z']);
  assert.deepEqual(comparisonChoices(sample,'a',['x','y']),[]);
  assert.equal(bestComparisonPartner(sample,'d'),null);
  assert.deepEqual(comparisonChoices(sample,'unknown'),[]);
});
test('real comparison pool has useful coverage and the original default pair remains valid',()=>{
  const ids=data.radar_concerns.map(id=>data.concerns.find(c=>c.id===id).benchmark_id).filter(Boolean);
  assert.equal(sharedCoverage(data,...data.radar_defaults.pair),8);
  assert.equal(sharedCoverage(data,...data.radar_defaults.pair,ids),6);
  const pool=data.models.filter(m=>bestComparisonPartner(data,m.id,ids));
  assert.ok(pool.length>=40&&pool.length<data.models.length);
  for(const model of pool)assert.ok(sharedCoverage(data,model.id,bestComparisonPartner(data,model.id,ids).id,ids)>=3);
});
test('Pareto frontier handles equal sizes, ties, zero scores and missing values honestly',()=>{
  const rows=[{id:'a',score:50,parameters:2},{id:'b',score:70,parameters:2},{id:'c',score:70,parameters:4},{id:'d',score:80,parameters:4},{id:'e',score:70,parameters:2},{id:'f',score:0,parameters:1},
    {id:'missing-score',score:null,parameters:1},{id:'missing-size',score:99,parameters:null},{id:'zero-size',score:99,parameters:0},{id:'infinite',score:Infinity,parameters:1}];
  const before=rows.map(r=>({...r}));
  assert.deepEqual(paretoFrontier(rows).map(r=>r.id),['f','b','e','d']);
  assert.equal(paretoFrontier(rows)[1],rows[1]);
  assert.deepEqual(rows,before);
  assert.deepEqual(paretoFrontier([]),[]);
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
test('protocol group counts match actual valid canonical model marks, including filtered sets',()=>{
  const ids=data.models.map(m=>m.id),subset=ids.slice(0,8);
  for(const metric of data.metrics)for(const selected of [ids,subset])for(const group of protocolGroups(data,metric.id,selected)){
    const visible=selected.filter(id=>available(data,id,metric.id).some(row=>row.comparability_group===group.id));
    assert.equal(group.models.size,visible.length);
    assert.deepEqual([...group.models].sort(),visible.sort());
  }
  assert.equal(new Set(data.scores.map(r=>[r.model_id,r.benchmark_id,r.comparability_group].join('|'))).size,data.scores.length);
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
test('January 2023 display retains earlier repository records in cumulative totals',()=>{
  const rows=data.growth.repository_creation;
  const earlier=rows.filter(r=>r.month<'2023-01').reduce((n,r)=>n+r.count,0);
  const january=rows.filter(r=>r.month==='2023-01').reduce((n,r)=>n+r.count,0);
  assert.equal(earlier,15);assert.equal(earlier+january,18);
  assert.equal(earlier+rows.filter(r=>r.month>='2023-01').reduce((n,r)=>n+r.count,0),18255);
  assert.equal(data.growth.verified_release.map(r=>r.month).sort()[0],'2023-10');
});
test('growth interaction is month inspection rather than date-window zoom',()=>{
  const source=readFileSync(new URL('../explorer.js',import.meta.url),'utf8');
  const growth=source.slice(source.indexOf('function renderGrowth(){'),source.indexOf('// 02 —'));
  for(const obsolete of ['brushX','date-from','date-to','growth-insight'])assert.ok(!growth.includes(obsolete),obsolete);
  for(const required of ['curveMonotoneX','data-earlier-count','data-inspected-total',".on('pointerdown',inspectPointer)","event.key==='ArrowLeft'", "event.key==='Home'"])assert.ok(growth.includes(required),required);
  assert.ok(growth.includes("first<'2023-01'?'2023-01':first"));
  assert.ok(growth.includes('r.month<from&&key(r)===k'));
});
