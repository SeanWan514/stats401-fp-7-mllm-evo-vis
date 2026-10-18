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
  const shared=aa.map(r=>r.comparability_group).filter(g=>bb.some(r=>r.comparability_group===g));
  const best=chosen!==undefined?chosen:(shared.find(g=>g.startsWith('card:'))||shared[0]||'');
  return {group:best,shared,a:aa.find(r=>r.comparability_group===best)||null,b:bb.find(r=>r.comparability_group===best)||null};
}
export function eligible(model,{family='all',license='all',max='all'}={}) {
  return model.open_weight===true&&(family==='all'||model.family_id===family)&&(license==='all'||(model.license||'unknown')===license)&&(max==='all'||(model.parameters_total_b!==null&&model.parameters_total_b!==undefined&&Number.isFinite(Number(model.parameters_total_b))&&Number(model.parameters_total_b)<=Number(max)));
}
export function matchFeedback(row,{family='all',platform='all'}={}) {return (family==='all'||row.family_id===family)&&(platform==='all'||row.platform===platform);}
export function concernCount(data,id,state={},scope='all',entity='') {return data.concern_buckets.filter(r=>r.concern_id===id&&r.scope===scope&&r.entity_id===entity&&matchFeedback(r,state)).reduce((n,r)=>n+(state.experience==='experience'?r.experience_count:r.count),0);}
