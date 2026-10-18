import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {available,eligible,protocolGroups} from '../assets/js/explorer-core.mjs';

// Exercise the production ranking helpers without a DOM or copied implementation.
const source=readFileSync(new URL('../assets/js/explorer.js',import.meta.url),'utf8');
const start=source.indexOf('// 05 —');
const end=Math.min(...['function exportBrief','function findings'].map(marker=>source.indexOf(marker,start)).filter(index=>index>=0));
const section=source.slice(start,end);
const data=JSON.parse(readFileSync(new URL('../data/final/explorer_data.json',import.meta.url)));
const context=vm.createContext({data,tasks:new Map(data.tasks.map(t=>[t.id,t])),metrics:new Map(data.metrics.map(m=>[m.id,m])),available,eligible,protocolGroups});
vm.runInContext(section,context);
const {sizeTier,rankedTaskTiers,taskSourceGroups,supportedTask}=context;

test('size tiers have explicit non-overlapping boundaries and exclude unknown sizes',()=>{
  assert.equal(sizeTier(.5),'compact');assert.equal(sizeTier(4),'compact');
  assert.equal(sizeTier(4.01),'small');assert.equal(sizeTier(10),'small');
  assert.equal(sizeTier(10.01),'medium');assert.equal(sizeTier(40),'medium');
  assert.equal(sizeTier(40.01),'large');
  for(const value of [null,undefined,NaN,Infinity,0,-1,'4'])assert.equal(sizeTier(value),null);
});
test('tier rankings cap visible rows, preserve ties and order by score rather than size',()=>{
  const rows=[['a',8,80],['b',7,90],['c',9,90],['d',6,85],['e',3,70],['missing',null,99]]
    .map(([id,parameters_total_b,score])=>({model:{id,name:id,parameters_total_b},row:{score}}));
  const small=rankedTaskTiers(rows).find(t=>t.id==='small');
  assert.equal(small.total,4);
  assert.equal(small.rows.map(r=>r.model.id).join(','),'b,c,d');
  assert.equal(small.rows.map(r=>r.rank).join(','),'1,1,3');
  assert.equal(small.rows.filter(r=>r.leading).length,2);
  assert.equal(rankedTaskTiers(rows).reduce((sum,t)=>sum+t.total,0),5);
  assert.equal(rows[0].model.id,'a');
});
test('only tasks with comparative scored-size evidence appear in the selector',()=>{
  const supported=data.tasks.filter(t=>supportedTask(t.id));
  assert.equal(supported.length,5);
  for(const id of ['visual-qa','ocr','document-understanding','chart-understanding','visual-reasoning'])assert.equal(supportedTask(id),true);
  for(const id of ['image-captioning','multimodal-conversation','video-understanding','unknown'])assert.equal(supportedTask(id),false);
  assert.equal(data.tasks.length,8,'Unsupported feedback categories stay in the dataset');
});
test('source coverage counts only canonical models with valid scores and positive known sizes',()=>{
  const corpus=data.models.filter(m=>m.open_weight===true);
  for(const metric of data.metrics){
    const groups=taskSourceGroups(metric.id,corpus);
    for(const group of groups){
      const counted=corpus.filter(m=>sizeTier(m.parameters_total_b)&&available(data,m.id,metric.id).some(r=>r.comparability_group===group.id));
      assert.equal(group.sizedCount,counted.length);
    }
    for(let i=1;i<groups.length;i++)assert.ok(groups[i-1].sizedCount>=groups[i].sizedCount);
  }
  assert.equal(taskSourceGroups('docvqa',corpus)[0].sizedCount,5);
});
test('task ranking contains no pair-selection calls and opens source evidence dialogs',()=>{
  assert.ok(!/actions\(|assignModel\(|renderEvolution\(|state\.a\b|state\.b\b/.test(section));
  assert.ok(section.includes("openModal('dialog-candidate',trigger)"));
  assert.ok(section.includes("openModal('dialog-all-candidates',e.currentTarget)"));
  assert.ok(!section.includes('selected-task-label'));
  assert.ok(!section.includes("el('details'"),'Candidate modal uses direct subsections, not nested accordions');
  assert.ok(section.includes("'Reset filters'"));
  assert.ok(section.includes('showExcerpts(exactSection,exact,data.excerpt_lookup,1)'));
  assert.ok(section.includes('showExcerpts(familySection,family,data.excerpt_lookup,1)'));
});
