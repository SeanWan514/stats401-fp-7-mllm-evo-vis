// Pure evidence operations shared by the interface and regression tests.
export function normalized(row, metric) {
  if (!row || row.ambiguous || row.score === null || row.score === undefined || !metric) return null;
  const score=Number(row.score), lo=Number(metric.range_min), hi=Number(metric.range_max);
  if (!Number.isFinite(score)||!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo||score<lo||score>hi) return null;
  return metric.higher_is_better===false ? 1-(score-lo)/(hi-lo) : (score-lo)/(hi-lo);
}
export function available(data,id,metric) {return data.scores.filter(r=>r.model_id===id&&r.benchmark_id===metric&&normalized(r,data.metrics.find(m=>m.id===metric))!==null);}
export function protocolGroups(data,mid,ids) {
  const rows=data.scores.filter(r=>r.benchmark_id===mid&&(!ids||ids.includes(r.model_id))&&normalized(r,data.metrics.find(m=>m.id===mid))!==null);
  const groups=new Map();for(const r of rows){if(!groups.has(r.comparability_group))groups.set(r.comparability_group,{id:r.comparability_group,row:r,models:new Set()});groups.get(r.comparability_group).models.add(r.model_id);}
  return [...groups.values()].sort((a,b)=>b.models.size-a.models.size||Number(b.row.source_type==='official_model_card')-Number(a.row.source_type==='official_model_card')||a.id.localeCompare(b.id));
}
export function pairScores(data,a,b,mid,chosen) {
  const aa=available(data,a,mid),bb=available(data,b,mid);
  const shared=[...new Set(aa.map(r=>r.comparability_group).filter(g=>bb.some(r=>r.comparability_group===g)))];
  const best=chosen!==undefined?chosen:(shared.find(g=>g.startsWith('card:'))||shared[0]||'');
  return {group:best,shared,a:aa.find(r=>r.comparability_group===best)||null,b:bb.find(r=>r.comparability_group===best)||null};
}

// Count a dimension once, only when both models have valid scores in the same
// recorded source group. Shared coverage is not a claim of controlled evaluation.
function comparisonIndex(data,metricIds=data.metrics.map(m=>m.id)) {
  const metrics=new Map(data.metrics.map(m=>[m.id,m]));
  const wanted=new Set(metricIds.filter(id=>metrics.has(id))),index=new Map();
  for(const row of data.scores){
    if(!wanted.has(row.benchmark_id)||!row.comparability_group||normalized(row,metrics.get(row.benchmark_id))===null)continue;
    if(!index.has(row.model_id))index.set(row.model_id,new Map());
    const model=index.get(row.model_id);
    if(!model.has(row.benchmark_id))model.set(row.benchmark_id,new Set());
    model.get(row.benchmark_id).add(row.comparability_group);
  }
  return index;
}
function indexedCoverage(index,a,b) {
  if(a===b||!index.has(a)||!index.has(b))return 0;
  let count=0;for(const [mid,groups] of index.get(a)){
    const other=index.get(b).get(mid);
    if(other&&[...groups].some(g=>other.has(g)))count++;
  }
  return count;
}
export function sharedCoverage(data,a,b,metricIds) {
  return indexedCoverage(comparisonIndex(data,metricIds),a,b);
}
// Return the original canonical model objects, excluding the anchor. Tie-breaking
// is stable so changing unrelated filters does not silently pick a different pair.
export function comparisonChoices(data,anchorId,metricIds,minShared=3) {
  if(!data.models.some(m=>m.id===anchorId))return [];
  const index=comparisonIndex(data,metricIds);
  return data.models.filter(m=>m.id!==anchorId).map(model=>({model,coverage:indexedCoverage(index,anchorId,model.id)}))
    .filter(({coverage})=>coverage>=minShared)
    .sort((a,b)=>b.coverage-a.coverage||(a.model.name||a.model.id).localeCompare(b.model.name||b.model.id)||a.model.id.localeCompare(b.model.id))
    .map(({model})=>model);
}
export function bestComparisonPartner(data,id,metricIds,minShared=3) {
  return comparisonChoices(data,id,metricIds,minShared)[0]||null;
}

// Input rows: {id, score, parameters}; scores must already be comparable within
// one benchmark/source group. Higher score and lower positive parameters win.
// Missing measurements are excluded. Identical points remain tied on the frontier.
// Returns original rows, ordered by parameters, then score and id; never mutates.
export function paretoFrontier(rows) {
  const valid=rows.filter(r=>typeof r.score==='number'&&Number.isFinite(r.score)&&typeof r.parameters==='number'&&Number.isFinite(r.parameters)&&r.parameters>0);
  return valid.filter(r=>!valid.some(other=>other.parameters<=r.parameters&&other.score>=r.score&&(other.parameters<r.parameters||other.score>r.score)))
    .sort((a,b)=>a.parameters-b.parameters||b.score-a.score||String(a.id).localeCompare(String(b.id)));
}
export function eligible(model,{family='all',license='all',max='all'}={}) {
  return model.open_weight===true&&(family==='all'||model.family_id===family)&&(license==='all'||(model.license||'unknown')===license)&&(max==='all'||(model.parameters_total_b!==null&&model.parameters_total_b!==undefined&&Number.isFinite(Number(model.parameters_total_b))&&Number(model.parameters_total_b)<=Number(max)));
}
export function matchFeedback(row,{family='all',platform='all'}={}) {return (family==='all'||row.family_id===family)&&(platform==='all'||row.platform===platform);}
export function concernCount(data,id,state={},scope='all',entity='') {return data.concern_buckets.filter(r=>r.concern_id===id&&r.scope===scope&&r.entity_id===entity&&matchFeedback(r,state)).reduce((n,r)=>n+(state.experience==='experience'?r.experience_count:r.count),0);}
