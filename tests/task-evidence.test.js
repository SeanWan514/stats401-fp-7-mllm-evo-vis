'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const evidence = require('../task-evidence.js');
const tasks = [{id:'ocr',label:'OCR',benchmark_ids:['ocrbench']}, {id:'chat',label:'Conversation',benchmark_ids:[]}];
const base = {month:'2025-01',family_id:'qwen-vl',platform:'github',scope:'all'};
const data = {tasks,feedback_totals:[{...base,count:10},{...base,platform:'huggingface',count:5},{...base,month:'unknown',count:3}],
  feedback_buckets:[{...base,task_id:'ocr',count:4,actual_experience_count:2},
    {...base,task_id:'ocr',scope:'model',count:4,actual_experience_count:2},
    {...base,task_id:'ocr',scope:'family',count:4,actual_experience_count:2},
    {...base,task_id:'chat',count:3,actual_experience_count:1},
    {...base,task_id:'ocr',platform:'huggingface',count:2,actual_experience_count:0}]};
test('scope copies never inflate task records; unlabeled feedback remains in the denominator', () => {
  const result=evidence.summarize(data,{});
  assert.equal(result.denominator,15);
  assert.deepEqual(result.profiles.map(row=>[row.count,row.experience]),[[6,2],[3,1]]);
});
test('platform, family, and period filters use the same denominator and task window', () => {
  const result=evidence.summarize(data,{platform:'github',family:'qwen-vl',from:'2025-01',to:'2025-01'});
  assert.equal(result.denominator,10);assert.equal(result.profiles[0].count,4);
  const empty=evidence.summarize(data,{family:'absent'});
  assert.equal(empty.denominator,0);assert(empty.profiles.every(row=>row.count===0));
});
test('overlapping task counts are never substituted for distinct eligible records', () => {
  const overlapping={...data,feedback_totals:[{...base,count:5}],feedback_buckets:[{...base,task_id:'ocr',count:4},{...base,task_id:'chat',count:4}]};
  const result=evidence.summarize(overlapping,{});
  assert.equal(result.denominator,5);assert.equal(result.profiles.reduce((sum,row)=>sum+row.count,0),8);
});
test('unmapped tasks remain selectable; measure switching changes ranks without changing counts', () => {
  const profiles=[{...tasks[0],count:2,experience:2},{...tasks[1],count:8,experience:1}];
  assert.equal(evidence.rank(profiles)[0].id,'chat');
  assert.equal(evidence.rank(profiles,{measure:'experience'})[0].id,'ocr');
  assert.deepEqual(evidence.rank(profiles,{mapping:'unmapped'}).map(row=>row.id),['chat']);
  assert.equal(profiles[1].count,8);
});
test('sample counts deduplicate IDs, preserve truncation, and do not imply full-record coverage', () => {
  const lookup={a:{id:'a',source_url:'https://example.org/a',published_at:'2025-01-01',experience_type:'usage_question'},
    b:{id:'b',source_url:'https://example.org/b',published_at:'2025-01-02',experience_type:'problem_report',truncated:true}};
  const rows=[{count:50,excerpt_ids:['a','b','missing']},{count:30,excerpt_ids:['b']}];
  assert.deepEqual(evidence.sample(rows,lookup).map(row=>row.id),['b','a']);
  assert.deepEqual(evidence.sample(rows,lookup,true).map(row=>row.id),['b']);
  assert.equal(evidence.sample(rows,lookup,true)[0].truncated,true);
});
test('full prepared snapshot reconciles known task counts and bounded experience subsets', () => {
  const data=require('../data/final/view_data.json');
  const result=evidence.summarize(data,{});
  assert.equal(result.denominator,21674);
  assert.equal(result.profiles.length,8);
  assert.equal(result.profiles.filter(row=>row.benchmark_ids.length).length,5);
  assert.equal(result.profiles.find(row=>row.id==='document-understanding').count,346);
  assert.equal(result.profiles.find(row=>row.id==='document-understanding').experience,100);
  assert(result.profiles.every(row=>row.experience<=row.count&&row.count<=result.denominator));
});
