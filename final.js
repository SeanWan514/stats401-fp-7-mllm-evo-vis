/* Evidence-aware integration preview. All source text is inserted as text, never HTML. */
'use strict';
(() => {
const $ = id => document.getElementById(id);
const fmt = value => new Intl.NumberFormat('en-US').format(value || 0);
const state = {family:'all', platform:'all', from:'', to:'', task:null, modelA:null, modelB:null, focusModel:null, page:0, groups:{}};
const taskView = {measure:'count', mapping:'all', sort:'count', samplePage:0};
let taskProfiles = [];
let data, colors, modelMap, taskMap, scoreIndex;
let feedbackCache = new Map(), feedbackCacheKey = '';
const PAGE_SIZE = 14;
const parameters = value => value===null||value===undefined||!Number.isFinite(Number(value))?'unknown':`${Number(value).toLocaleString('en-US',{maximumFractionDigits:2})}B`;
function settingLabel(row) {if(!row)return 'Unknown protocol';let source=row.source_type==='openvlm_baseline'?'OpenVLM baseline':'Official source';try{if(row.source_type!=='openvlm_baseline')source=new URL(row.source_urls?.[0]).pathname.split('/').filter(Boolean).at(-1).replace(/-Instruct$/i,'');}catch{}return `${source} · ${row.split||'split unknown'}${row.benchmark_version&&row.benchmark_version!=='unknown'?' · v'+row.benchmark_version:''}`;}

const clean = node => { node.replaceChildren(); return node; };
function el(tag, text, parent, cls) { const node=document.createElement(tag); if(text!==undefined && text!==null) node.textContent=String(text); if(cls) node.className=cls; if(parent) parent.append(node); return node; }
function safeLink(url, label, parent) { try { const parsed=new URL(url); if(!['https:','http:'].includes(parsed.protocol)) return null; const a=el('a',label,parent); a.href=parsed.href; a.target='_blank'; a.rel='noopener noreferrer'; return a; } catch { return null; } }
function option(select, value, label) {const opt=el('option',label,select);opt.value=value;return opt;}
function setOptions(id, entries, initial) {const select=clean($(id));entries.forEach(([value,label])=>option(select,value,label));if(initial!==undefined)select.value=initial;}
function empty(id, message) {el('p',message,clean($(id)),'empty');}
function svg(id,w=1000,h=380) {return d3.select(clean($(id))).append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('role','group');}
function tip(event,text) {const node=$('tooltip');node.textContent=text;node.hidden=false;node.style.left=`${Math.min(window.innerWidth-325,event.clientX+14)}px`;node.style.top=`${Math.min(window.innerHeight-160,event.clientY+12)}px`;}
function hideTip() {$('tooltip').hidden=true;}
function activate(selection, callback, description) {selection.attr('tabindex',0).attr('role','button').attr('aria-label',description).on('click',callback).on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();callback(event,d);}});}
function inWindow(row) {return row.month!=='unknown' && (!state.from||row.month>=state.from)&&(!state.to||row.month<=state.to);}
function familyMatch(row) {return state.family==='all'||row.family_id===state.family;}
function feedbackMatch(row) {return familyMatch(row)&&inWindow(row)&&(state.platform==='all'||row.platform===state.platform);}
function buckets(task,scope='all',entity=null) {return data.feedback_buckets.filter(r=>r.task_id===task&&r.scope===scope&&(entity===null||r.entity_id===entity)&&feedbackMatch(r));}
function sum(rows,key='count') {return d3.sum(rows,r=>Number(r[key])||0);}
function feedbackInfo(task,scope='all',entity=null) {
 const filterKey=JSON.stringify([state.family,state.from,state.to,state.platform]);
 if(filterKey!==feedbackCacheKey){feedbackCache.clear();feedbackCacheKey=filterKey;}
 const key=JSON.stringify([task,scope,entity]);
 if(!feedbackCache.has(key)){const rows=buckets(task,scope,entity);feedbackCache.set(key,{count:sum(rows),experience:sum(rows,'actual_experience_count'),validated:sum(rows,'validated_count'),rows});}
 return feedbackCache.get(key);
}
function sources(parent,urls,label='Source') {const box=el('div',null,parent,'evidence-links');[...new Set(urls.filter(Boolean))].slice(0,6).forEach((url,i)=>safeLink(url,`${label}${urls.length>1?' '+(i+1):''} ↗`,box));}
function excerpts(parent,rows) {const seen=new Set();const snippets=rows.flatMap(r=>r.excerpts||[]).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))).filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true;}).slice(0,4);if(!snippets.length){el('p','No source excerpts in the selected window.',parent);return;}snippets.forEach(r=>{const box=el('div',null,parent,'excerpt');el('small',`${r.platform} · ${String(r.published_at||'date unknown').slice(0,10)} · ${r.attribution_level||'unresolved'} attribution · role: ${r.role||'unknown'} · ${r.experience_type||'unclear experience'}`,box);el('blockquote',r.text+(r.truncated?'…':''),box);el('small',`${r.sentiment||'unclear'} · ${r.validation_status||'not validated'} · ${r.label_method||'label method unknown'}`,box);safeLink(r.source_url,'Read source ↗',box);});}
function taskTitle(id) {return taskMap.get(id)?.label||id;}
function familyTitle(id) {return data.families.find(f=>f.id===id)?.label||id;}
function updateShared() {state.page=0;taskView.samplePage=0;renderGrowth();renderTasks();renderEvolution();renderMatrix();}
function selectTask(id) {state.task=id;state.page=0;taskView.samplePage=0;$('matrix-task').value=id;renderTasks();renderMatrix();}
function focusModel(id) {state.focusModel=id;renderEvolution();renderModelEvidence();renderMatrixEvidence();}
function sendToRadar(id,slot) {
 const other=slot==='modelA'?'modelB':'modelA';
 if(state[other]===id&&state[slot]!==id){state[other]=state[slot];$(other==='modelA'?'model-a':'model-b').value=state[other];}
 state[slot]=id;$(slot==='modelA'?'model-a':'model-b').value=id;
 state.groups={};renderRadar();renderEvolution();renderMatrix();
}
function modelActions(parent,id) {const actions=el('div',null,parent,'evidence-actions');[['Use as model A','modelA'],['Use as model B','modelB']].forEach(([label,slot])=>{const button=el('button',label,actions,'button');button.type='button';button.addEventListener('click',()=>{sendToRadar(id,slot);$('radar').scrollIntoView({behavior:'auto'});});});}
function renderGrowth() {
 hideTip();
 const mode=$('growth-mode').value, type=$('repo-type').value;
 $('repo-type').disabled=mode!=='repository_creation';
 const sourceRows=(data.growth[mode]||[]).filter(r=>familyMatch(r)&&(mode!=='repository_creation'||type==='all'||r.repo_type===type));
 const rows=sourceRows.filter(inWindow), total=sum(rows), unknown=sum(sourceRows.filter(r=>r.month==='unknown'));
 const omittedReleases=data.models.filter(familyMatch).length-sum(data.growth.verified_release.filter(familyMatch));
 const snapshotMonth=data.generated_at.slice(0,7), snapshotDay=data.generated_at.slice(0,10);
 const snapshotDate=new Date(data.generated_at), partial=snapshotDate.getUTCDate()<new Date(Date.UTC(snapshotDate.getUTCFullYear(),snapshotDate.getUTCMonth()+1,0)).getUTCDate();
 $('growth-total').textContent=`${fmt(total)} ${mode==='repository_creation'?'unique repositories created':'verified canonical releases'} in selected months`;
 const partialInWindow=partial&&(!state.from||snapshotMonth>=state.from)&&(!state.to||snapshotMonth<=state.to);
 $('growth-note').textContent=`${mode==='repository_creation'?'Creation dates describe repository activity, including original releases and derivatives.':'Only canonical models with a verified release flag, a date, and a release evidence URL are counted.'} ${fmt(unknown)} records with unknown dates are excluded.${mode==='verified_release'?` ${fmt(omittedReleases)} canonical models in the selected family scope lack verified release evidence and are omitted, regardless of period.`:''}${partialInWindow?` ${snapshotMonth} is partial: acquisition stops on ${snapshotDay}; its count is not a full-month rate.`:''}`;
 const families=[...new Set(rows.map(r=>r.family_id))].sort(), legend=clean($('family-legend'));
 const all=el('button','All families',legend,'legend-filter');all.type='button';all.setAttribute('aria-pressed',state.family==='all');all.addEventListener('click',()=>{state.family='all';$('family-filter').value='all';updateShared();});
 families.forEach(f=>{
  const item=el('button',null,legend,'legend-filter');item.type='button';item.setAttribute('aria-pressed',state.family===f);item.setAttribute('aria-label',`Isolate ${familyTitle(f)} family`);
  const dot=el('i',null,item,'legend-dot');dot.style.background=colors(f);el('span',`${familyTitle(f)} · ${fmt(sum(rows.filter(r=>r.family_id===f)))}`,item);
  item.addEventListener('click',()=>{state.family=f;$('family-filter').value=f;updateShared();});
 });
 const types=clean($('growth-types'));
 if(mode==='repository_creation')for(const [kind,values] of d3.group(rows,r=>r.repo_type))el('span',`${kind.replaceAll('_',' ')}: ${fmt(sum(values))}`,types);
 const head=clean($('growth-values').querySelector('thead')),body=clean($('growth-values').querySelector('tbody')),foot=clean($('growth-values').querySelector('tfoot'));
 if(!rows.length){empty('growth-chart','No dated records match these filters. Reset the period or choose another count definition.');el('tr',null,body).append(el('td','No dated records in this selection.'));return;}
 const parse=d3.timeParse('%Y-%m'), format=d3.timeFormat('%Y-%m');
 const first=parse(state.from||d3.min(rows,r=>r.month)), last=parse(state.to||d3.max(rows,r=>r.month)), end=d3.timeMonth.offset(last,1);
 const months=d3.timeMonth.range(first,end),increments=d3.rollup(rows,v=>sum(v),r=>r.month,r=>r.family_id),running=Object.fromEntries(families.map(f=>[f,0]));
 const points=months.map(date=>{
  const month=format(date), counts=increments.get(month);
  families.forEach(f=>running[f]+=counts?.get(f)||0);
  return {date,month,newCount:sum(rows.filter(r=>r.month===month)),...running};
 });
 const heading=el('tr',null,head);['Month','New records','Cumulative',...families.map(familyTitle)].forEach(label=>el('th',label,heading).scope='col');
 points.forEach(point=>{
  const tr=el('tr',null,body);if(partial&&point.month===snapshotMonth)tr.className='partial-period';
  el('th',point.month+(partial&&point.month===snapshotMonth?' · partial':''),tr).scope='row';
  [point.newCount,d3.sum(families,f=>point[f]),...families.map(f=>increments.get(point.month)?.get(f)||0)].forEach(value=>el('td',fmt(value),tr));
 });
 const totals=el('tr',null,foot);el('th','Period total',totals).scope='row';[total,total,...families.map(f=>running[f])].forEach(value=>el('td',fmt(value),totals));
 const w=1000,h=350,m={top:28,right:20,bottom:48,left:70},s=svg('growth-chart',w,h);
 const x=d3.scaleTime().domain([first,end]).range([m.left,w-m.right]),y=d3.scaleLinear().domain([0,total||1]).nice().range([h-m.bottom,m.top]);
 s.append('g').attr('transform',`translate(0,${h-m.bottom})`).call(d3.axisBottom(x).ticks(7).tickFormat(d3.timeFormat('%b %Y')));
 s.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')));
 s.append('text').attr('x',m.left).attr('y',14).text(`Cumulative ${mode==='repository_creation'?'repositories':'canonical releases'} · count`);
 s.append('text').attr('x',m.left).attr('y',h-5).text('Calendar month · accumulation starts at the selected From month');
 // Extend the final monthly step through its interval, including single-month selections.
 const drawPoints=[...points,{...points.at(-1),date:end}];
 const area=d3.area().x(d=>x(d.data.date)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveStepAfter);
 const paths=s.selectAll('.area').data(d3.stack().keys(families)(drawPoints)).join('path').attr('class','area').attr('d',area).style('fill',d=>colors(d.key)).attr('fill-opacity',.8).attr('stroke','white').attr('stroke-width',.4);
 paths.append('title').text(d=>`${familyTitle(d.key)}: ${fmt(running[d.key])} records in this period. Exact monthly values are below the chart.`);
 if(partialInWindow){
  s.append('defs').append('pattern').attr('id','partial-month-hatch').attr('width',6).attr('height',6).attr('patternUnits','userSpaceOnUse').append('path').attr('d','M0,6L6,0').attr('stroke','#302027').attr('stroke-opacity',.3);
  const start=x(parse(snapshotMonth)),stop=x(d3.timeMonth.offset(parse(snapshotMonth),1));
  s.append('rect').attr('x',start).attr('y',m.top).attr('width',Math.max(0,stop-start)).attr('height',h-m.bottom-m.top).attr('fill','url(#partial-month-hatch)');
  s.append('text').attr('x',Math.min(w-m.right,start+2)).attr('y',m.top+12).attr('text-anchor','end').style('font-size','10px').text(`${snapshotMonth} partial`);
 }
 const brush=d3.brushX().extent([[m.left,m.top],[w-m.right,h-m.bottom]]).on('end',event=>{
  if(!event.sourceEvent||!event.selection)return;
  const [a,b]=event.selection;
  state.from=format(x.invert(a));state.to=format(x.invert(Math.max(a,b-.01)));
  $('date-from').value=state.from;$('date-to').value=state.to;updateShared();
 });
 s.append('g').call(brush).on('pointermove.tooltip',event=>{
  if(event.buttons){hideTip();return;}
  const period=format(x.invert(d3.pointer(event,s.node())[0])),point=points.find(p=>p.month===period);
  if(point)tip(event,`${period}${partial&&period===snapshotMonth?' · partial':''}\n${fmt(d3.sum(families,f=>point[f]))} cumulative records\n${fmt(point.newCount)} new records this month\nExact family values are in the table below.`);
 }).on('pointerleave.tooltip',hideTip);
}
function renderTasks() {
 hideTip();
 const summary=TaskEvidence.summarize(data,state);taskProfiles=summary.profiles;
 const ranked=TaskEvidence.rank(taskProfiles,taskView),denominator=summary.denominator;
 const experience=taskView.measure==='experience',measureLabel=experience?'rule-inferred experience reports':'task-tagged records';
 const share=value=>!denominator?'Unavailable':value>0&&value/denominator<.001?'<0.1%':`${(100*value/denominator).toFixed(1)}%`;
 const maximum=d3.max(ranked,task=>task[taskView.measure])||1,font=d3.scaleSqrt().domain([0,maximum]).range([15,26]);
 const mappedCount=taskProfiles.filter(task=>task.benchmark_ids?.length).length;
 $('task-summary').textContent=`${fmt(denominator)} eligible feedback records in the current shared filters · ${ranked.length}/${taskProfiles.length} supported tasks shown · ${mappedCount} definitions have benchmark mappings. Full snapshot: ${fmt(data.counts.task_labeled_feedback)} of ${fmt(data.counts.feedback)} records have at least one supported task label.${!denominator?' No eligible feedback in this window; task definitions remain available.':''}`;
 $('task-ranking-title').textContent=experience?'Experience reports by task':'Task-tagged records by task';
 document.querySelector('.task-record-key').style.background=experience?'#b75252':'#365a67';
 const cloud=d3.select($('task-cloud'));
 cloud.selectAll('p.empty').remove();
 const phrases=cloud.selectAll('button').data(ranked,task=>task.id).join(enter=>{
  const button=enter.append('button').attr('type','button').attr('class','task-phrase');
  button.append('span').attr('class','phrase-name');button.append('span').attr('class','phrase-count');button.append('span').attr('class','mapping-badge');return button;
 }).order().attr('data-task-id',task=>task.id).attr('aria-pressed',task=>task.id===state.task).attr('aria-controls','task-evidence matrix-chart')
  .attr('aria-label',task=>`${task.label}: ${fmt(task[taskView.measure])} ${measureLabel}. ${task.benchmark_ids?.length?'Benchmark mapping available.':'No benchmark mapping.'} Select task.`)
  .on('click',(event,task)=>selectTask(task.id));
 phrases.select('.phrase-name').style('font-size',task=>`${font(task[taskView.measure])}px`).text(task=>task.label);
 phrases.select('.phrase-count').text(task=>`${fmt(task[taskView.measure])} ${experience?'reports':'records'}`);
 phrases.select('.mapping-badge').classed('unmapped',task=>!task.benchmark_ids?.length).text(task=>task.benchmark_ids?.length?`${task.benchmark_ids.length} mapped benchmark${task.benchmark_ids.length===1?'':'s'}`:'No benchmark mapping');
 const rankedItems=d3.select($('task-ranked')).selectAll('li').data(ranked,task=>task.id).join(enter=>{
  const li=enter.append('li'),button=li.append('button').attr('type','button');
  const line=button.append('span').attr('class','rank-line');line.append('span').attr('class','rank-name');line.append('strong').attr('class','rank-count');
  const bar=button.append('svg').attr('class','rank-bar').attr('viewBox','0 0 1000 9').attr('aria-hidden','true');
  bar.append('rect').attr('width',1000).attr('height',9).attr('rx',4).attr('fill','#eee6e1');
  bar.append('rect').attr('class','rank-value').attr('height',9).attr('rx',4);
  button.append('small').attr('class','rank-share');return li;
 }).order();
 rankedItems.select('button').attr('data-task-id',task=>task.id).attr('aria-pressed',task=>task.id===state.task).attr('aria-controls','task-evidence matrix-chart').on('click',(event,task)=>selectTask(task.id));
 rankedItems.select('.rank-name').text((task,i)=>`${i+1}. ${task.label}`);rankedItems.select('.rank-count').text(task=>fmt(task[taskView.measure]));
 rankedItems.select('.rank-value').attr('width',task=>1000*task[taskView.measure]/maximum).attr('fill',experience?'#b75252':'#365a67');
 rankedItems.select('.rank-share').text(task=>`${share(task[taskView.measure])} of eligible feedback${task.benchmark_ids?.length?'':' · no benchmark mapping'}`);
 if(!ranked.length)el('p','No task definitions match this coverage filter.', $('task-cloud'),'empty');
 const task=taskProfiles.find(task=>task.id===state.task),panel=clean($('task-evidence'));
 $('task-selection-note').textContent=task&&!ranked.some(row=>row.id===task.id)?`Selected task: ${task.label}. It is hidden by the local task-coverage filter; its evidence and matrix selection are retained.`:'';
 if(!task){el('p','Select a task phrase to inspect its definition and evidence.',panel);renderTaskSources();return;}
 const heading=el('div',null,panel,'task-panel-heading');el('h3',task.label,heading);
 const route=el('a','Inspect model candidates ↓',heading,'button');route.href='#matrix';
 el('p',task.definition,panel);
 const stats=el('div',null,panel,'task-facts');
 [[fmt(task.count),'task-tagged records'],[fmt(task.experience),'experience reports · rule-inferred'],[share(task[taskView.measure]),`${measureLabel} / ${fmt(denominator)} eligible records`]].forEach(([value,label])=>{const fact=el('div',null,stats);el('strong',value,fact);el('span',label,fact);});
 el('p','A distinct issue body or comment counts once per task. Experience reports are the rule-inferred usage-observation/problem-report subset, not verified independent users. Label accuracy has not been measured.',panel);
 const mapping=el('div',null,panel,'task-mapping-detail');el('strong',task.benchmark_ids?.length?'Mapped benchmark evidence':'Benchmark evidence gap',mapping);
 if(task.benchmark_ids?.length){const links=el('div',null,mapping,'evidence-links');task.benchmark_ids.forEach(id=>{const metric=data.metrics.find(metric=>metric.id===id);if(!safeLink(metric?.definition_url,metric?.label||id,links))el('span',metric?.label||id,links);});}
 el('p',task.mapping_rationale||'No verified benchmark mapping is available for this task.',mapping);
 if(!task.benchmark_ids?.length)el('p','Community records remain inspectable; quantitative task suitability is unavailable in the prepared benchmark table.',mapping);
 const rules=el('details',null,panel);el('summary','How this task is tagged',rules);el('p','These inclusion phrases support transparent rule labels; contextual rules may also apply. They are not word-frequency estimates or manually validated task assignments.',rules);
 const terms=el('div',null,rules,'task-rule-terms');(task.inclusion_rules||[]).forEach(term=>el('span',term,terms));
 renderTaskSources();
}
function renderTaskSources() {
 const sampleKey=JSON.stringify([state.task,taskView.measure,state.family,state.platform,state.from,state.to]);
 if(taskView.sampleKey!==sampleKey){taskView.samplePage=0;taskView.sampleKey=sampleKey;}
 const task=taskProfiles.find(task=>task.id===state.task),experience=taskView.measure==='experience';
 const sample=task?TaskEvidence.sample(task.rows,data.excerpt_lookup||{},experience):[];
 const pages=Math.max(1,Math.ceil(sample.length/4));taskView.samplePage=Math.max(0,Math.min(taskView.samplePage,pages-1));
 const visible=sample.slice(taskView.samplePage*4,(taskView.samplePage+1)*4),container=clean($('task-excerpts'));
 $('task-source-title').textContent=task?`Read the supporting records · ${task.label}`:'Read the supporting records';
 $('task-source-note').textContent=`${fmt(task?.[taskView.measure]||0)} ${experience?'rule-inferred experience reports':'task-tagged records'} are counted in this window; ${sample.length} unique ${sample.length===1?'excerpt is':'excerpts are'} available in the prepared sample. Excerpts are at most 280 characters and are selected by the data pipeline, not a representative sample. Paging explores this sample only.`;
 if(!visible.length)el('p',task?.[taskView.measure]?'No matching excerpt was retained in the prepared sample for these filters. The aggregate count above still applies.':'No supporting records for this task and count definition in the selected window.',container,'empty');
 visible.forEach(row=>{
  const card=el('article',null,container,'task-source-card');
  el('p',`${row.platform} · ${String(row.published_at||'date unknown').slice(0,10)}`,card,'source-dateline');
  el('p',`${String(row.attribution_level||'unresolved').replaceAll('_',' ')} attribution · ${String(row.experience_type||'unclear experience').replaceAll('_',' ')}`,card,'source-tags');
  el('blockquote',row.text+(row.truncated?'…':''),card);
  el('small',`Author role: ${row.role||'unknown'} · ${String(row.validation_status||'not validated').replaceAll('_',' ')}${row.truncated?' · truncated excerpt':''}`,card);
  safeLink(row.source_url,'Read original record ↗',card);
 });
 $('task-sample-status').textContent=sample.length?`Sample ${taskView.samplePage*4+1}–${Math.min(sample.length,(taskView.samplePage+1)*4)} of ${sample.length}`:'0 sample excerpts';
 $('task-prev').disabled=taskView.samplePage===0;$('task-next').disabled=taskView.samplePage>=pages-1;
}
function renderEvolution() {
 const models=data.models.filter(m=>familyMatch(m)&&m.release_date&&inWindow({month:m.release_date.slice(0,7)}));
 const allInFamily=data.models.filter(familyMatch);const undated=allInFamily.filter(m=>!m.release_date).length;
 $('evolution-note').textContent=`${models.length} dated canonical models in window · ${undated} without day-level dates. Dates retain their verification status; inspect nodes.`;
 if(!models.length){empty('evolution-chart','No canonical model dates match this window. Unknown release dates are not replaced by repository creation dates.');renderModelEvidence();return;}
 const families=[...new Set(models.map(m=>m.family_id||'unknown'))].sort();const w=1100,lane=78,h=85+families.length*lane;const margin={left:140,right:55,top:35,bottom:50};const dates=models.map(m=>new Date(m.release_date));const extent=d3.extent(dates);if(+extent[0]===+extent[1])extent[1]=d3.timeMonth.offset(extent[1],1);const x=d3.scaleTime().domain(extent).nice().range([margin.left,w-margin.right]);const y=d3.scalePoint().domain(families).range([margin.top+lane/2,h-margin.bottom-lane/2]);const s=svg('evolution-chart',w,h);s.append('defs').append('marker').attr('id','relationship-arrow').attr('viewBox','0 -5 10 10').attr('refX',13).attr('refY',0).attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#8f7e83');
 s.append('g').attr('transform',`translate(0,${h-margin.bottom})`).call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat('%b %Y')));
 families.forEach(f=>{s.append('line').attr('x1',margin.left).attr('x2',w-margin.right).attr('y1',y(f)).attr('y2',y(f)).attr('stroke','#e9dfdb');s.append('text').attr('x',margin.left-12).attr('y',y(f)+4).attr('text-anchor','end').style('fill',colors(f)).text(familyTitle(f));});
 const positions=new Map();families.forEach(f=>{const byDate=d3.group(models.filter(m=>(m.family_id||'unknown')===f),m=>m.release_date);for(const siblings of byDate.values())siblings.forEach((m,i)=>positions.set(m.id,{x:x(new Date(m.release_date)),y:y(f)+(i-(siblings.length-1)/2)*13}));});
 const relations=data.relationships.filter(r=>positions.has(r.source_model_id)&&positions.has(r.target_model_id)&&($('relationship-filter').value==='all'||r.relationship_type===$('relationship-filter').value));
 const rel=s.append('g').selectAll('path').data(relations).join('path').attr('d',r=>{const a=positions.get(r.source_model_id),b=positions.get(r.target_model_id);return `M${a.x},${a.y} C${(a.x+b.x)/2},${a.y-24} ${(a.x+b.x)/2},${b.y-24} ${b.x},${b.y}`;}).attr('fill','none').attr('stroke','#8f7e83').attr('stroke-width',1.3).attr('stroke-opacity',.65).attr('marker-end','url(#relationship-arrow)').attr('stroke-dasharray',r=>/sequence|chronolog/i.test(r.relationship_type)?'5 4':null);
 rel.append('title').text(r=>`${modelMap.get(r.source_model_id)?.name} → ${modelMap.get(r.target_model_id)?.name}\n${r.relationship_type}\n${r.evidence||''}\n${r.source_url}`);
 const nodes=s.append('g').selectAll('circle').data(models).join('circle').attr('cx',m=>positions.get(m.id).x).attr('cy',m=>positions.get(m.id).y).attr('r',m=>[state.modelA,state.modelB,state.focusModel].includes(m.id)?7:5).attr('fill',m=>colors(m.family_id||'unknown')).attr('stroke',m=>m.id===state.focusModel?'#302027':'white').attr('stroke-width',2);
 nodes.on('pointermove',(event,m)=>tip(event,`${m.name}\n${m.release_date} · ${m.release_status||'status unknown'}\nClick to inspect sources`)).on('pointerleave',hideTip);activate(nodes,(event,m)=>{hideTip();focusModel(m.id);},m=>`${m.name}, ${m.release_date}. Inspect model and relationships.`);nodes.append('title').text(m=>`${m.name} · ${m.release_date}`);
 const labels=models.filter(m=>$('node-labels').value==='all'||[state.modelA,state.modelB,state.focusModel].includes(m.id));s.selectAll('.node-label').data(labels).join('text').attr('class','node-label').attr('x',m=>positions.get(m.id).x+9).attr('y',m=>positions.get(m.id).y-8).style('font-size','9px').style('fill','#40333b').text(m=>m.name.length>28?m.name.slice(0,27)+'…':m.name);renderModelEvidence();
}
function renderModelEvidence() {
 const panel=clean($('model-evidence'));const model=modelMap.get(state.focusModel||state.modelA);if(!model){el('p','Select a model node to inspect provenance.',panel);return;}
 el('h3',model.name,panel);el('p',`${model.family||model.family_id} · ${model.publisher||'publisher unknown'} · ${model.release_date||'release date unknown'} (${model.release_status||'verification status unknown'})`,panel);
 el('p',`Total parameters: ${parameters(model.parameters_total_b)} · Active parameters: ${parameters(model.parameters_active_b)} · License: ${model.license||'unknown'} · Open-weight: ${model.open_weight===true?'yes':model.open_weight===false?'no':'unknown'}`,panel);
 sources(panel,[model.release_evidence_url,...(model.source_urls||[])]);const relations=data.relationships.filter(r=>r.source_model_id===model.id||r.target_model_id===model.id);el('p',relations.length?`${relations.length} sourced relationship records`:'No sourced relationships recorded. Chronological proximity alone does not establish ancestry.',panel);
 relations.slice(0,8).forEach(r=>{const p=el('p',`${modelMap.get(r.source_model_id)?.name||r.source_model_id} → ${modelMap.get(r.target_model_id)?.name||r.target_model_id} · ${r.relationship_type}. ${r.evidence||''} `,panel);safeLink(r.source_url,'Evidence ↗',p);});modelActions(panel,model.id);
}
function availableScores(id,mid) {return scoreIndex.get(id)?.get(mid)||[];}
function axisPair(metric) {
 const a=availableScores(state.modelA,metric.id),b=availableScores(state.modelB,metric.id);const union=[...new Set([...a,...b].map(r=>r.comparability_group))];const shared=union.filter(g=>a.some(r=>r.comparability_group===g)&&b.some(r=>r.comparability_group===g));
 const chosen=state.groups[metric.id]??shared.find(g=>a.some(r=>r.comparability_group===g&&r.comparability_status==='source_table_only'))??shared[0]??'';
 return {a:chosen?a.find(r=>r.comparability_group===chosen):null,b:chosen?b.find(r=>r.comparability_group===chosen):null,chosen,union,shared};
}
function normalized(row,metric) {if(!row||row.score===null||row.ambiguous)return null;const min=Number(metric.range_min??0),max=Number(metric.range_max);if(!Number.isFinite(max)||max<=min||row.score<min||row.score>max)return null;return metric.higher_is_better===false?1-(row.score-min)/(max-min):(row.score-min)/(max-min);}
function renderRadar() {
 const selected=[modelMap.get(state.modelA),modelMap.get(state.modelB)];if(!selected[0]||!selected[1]){empty('radar-chart','Two canonical models are required for comparison.');return;}
 const metrics=data.metrics.slice(0,8),pairs=metrics.map(axisPair),n=metrics.length;const values=[pairs.map((p,i)=>normalized(p.a,metrics[i])),pairs.map((p,i)=>normalized(p.b,metrics[i]))];
 const coverage=values.map(series=>series.filter(v=>v!==null).length);
 $('radar-coverage').textContent=`Selected setting coverage: A ${coverage[0]}/${n} · B ${coverage[1]}/${n}. ${pairs.filter(p=>!p.shared.length).length} axes have no shared score setting.`;
 const qualified=pairs.some(p=>[p.a,p.b].some(row=>row&&['source_table_only','unknown_settings'].includes(row.comparability_status)));
 $('radar-notice').textContent=(state.modelA===state.modelB?'Both selectors currently show the same model. Choose a second model for comparison. ':Math.min(...coverage)<n?'Incomplete profile: unavailable dimensions remain gaps. ':'All eight published dimensions are available for this pair. ')+(qualified?'Some evaluation settings are unspecified; shared source tables support a qualified descriptive comparison. ':'Inspect each axis’s evaluation setting and sources before comparing.');
 const meta=clean($('model-meta'));selected.forEach((m,i)=>{
  const article=el('article',null,meta);el('p',`MODEL ${i?'B':'A'}`,article,'eyebrow');el('h3',m.name,article);
  el('p',`${m.family||m.family_id} · ${parameters(m.parameters_total_b)} total · ${m.license||'license unknown'}`,article);
  el('p',`Active parameters: ${parameters(m.parameters_active_b)} · ${m.open_weight===true?'Open-weight':m.open_weight===false?'Closed-weight':'Weight access unknown'}`,article);
  el('p',`Release: ${m.release_date||'unknown'} · ${m.release_status||'status unknown'}`,article);sources(article,[...(m.source_urls||[]).slice(0,1),m.release_evidence_url]);
  const actions=el('div',null,article,'evidence-actions');
  [['Inspect development','evolution'],['Practical reports','matrix']].forEach(([label,target])=>{
   const button=el('button',label,actions,'button');button.type='button';
   button.addEventListener('click',()=>{focusModel(m.id);$(target==='matrix'?'matrix-evidence':'model-evidence').scrollIntoView({behavior:'auto'});});
  });
 });
 const w=570,h=450,cx=285,cy=223,radius=150;const s=svg('radar-chart',w,h);const position=(i,value)=>{const theta=i/n*2*Math.PI-Math.PI/2;return [cx+Math.cos(theta)*radius*value,cy+Math.sin(theta)*radius*value];};
 [0.25,.5,.75,1].forEach(level=>{s.append('polygon').attr('points',metrics.map((m,i)=>position(i,level).join(',')).join(' ')).attr('fill',level===1?'#fcf8f5':'none').attr('stroke','#e1d7d2').lower();s.append('text').attr('x',cx+4).attr('y',cy-radius*level+12).style('font-size','9px').text(`${level*100}%`);});
 metrics.forEach((m,i)=>{const p=position(i,1),label=position(i,1.18);s.append('line').attr('x1',cx).attr('y1',cy).attr('x2',p[0]).attr('y2',p[1]).attr('stroke','#e1d7d2');s.append('text').attr('x',label[0]).attr('y',label[1]).attr('text-anchor',Math.abs(label[0]-cx)<10?'middle':label[0]>cx?'start':'end').attr('dominant-baseline','middle').style('font-size','10px').text(m.label);});
 values.forEach((series,index)=>{
  const color=index?'#3c759a':'#b75252';
  for(let i=0;i<n;i++){
   const j=(i+1)%n;if(series[i]===null||series[j]===null)continue;
   const a=position(i,series[i]),b=position(j,series[j]);
   s.append('line').attr('x1',a[0]).attr('y1',a[1]).attr('x2',b[0]).attr('y2',b[1]).attr('stroke',color).attr('stroke-width',2.5).attr('stroke-dasharray',index?'6 3':null).attr('opacity',.85);
  }
  series.forEach((value,i)=>{
   if(value===null){const p=position(i,.97-index*.07);s.append('text').attr('x',p[0]).attr('y',p[1]+3).attr('text-anchor','middle').style('fill',color).style('font-size','12px').text('×').append('title').text(`${selected[index].name}: ${metrics[i].label} unavailable`);return;}
   const p=position(i,value),row=index?pairs[i].b:pairs[i].a;
   const text=`${selected[index].name} · ${metrics[i].label}: ${row.score} ${row.unit||metrics[i].unit} (${(value*100).toFixed(1)}% of fixed range)`;
   const marker=s.append('path').attr('class',`radar-marker model-${index?'b':'a'}`).attr('d',d3.symbol().type(index?d3.symbolSquare:d3.symbolCircle).size(55)()).attr('transform',`translate(${p[0]},${p[1]})`).attr('fill',color).attr('stroke','white').attr('stroke-width',1).attr('tabindex',0).attr('aria-label',text);
   marker.append('title').text(text);
  });
 });
 const tbody=clean($('raw-scores').querySelector('tbody'));metrics.forEach((metric,i)=>{const pair=pairs[i],tr=el('tr',null,tbody);const th=el('td',metric.label,tr);el('small',`${metric.range_min}–${metric.range_max} ${metric.unit||''}`,th);const setting=el('td',null,tr);const select=el('select',null,setting);select.setAttribute('aria-label',`${metric.label} comparison setting`);option(select,'','No shared setting selected');pair.union.forEach(group=>{const row=data.scores.find(r=>r.benchmark_id===metric.id&&r.comparability_group===group&&(r.model_id===state.modelA||r.model_id===state.modelB));const item=option(select,group,(pair.shared.includes(group)?'A + B · ':'Partial · ')+settingLabel(row));item.title=group;});select.value=pair.chosen;select.title=pair.chosen;const protocol=el('details',null,setting);el('summary','Protocol identifier',protocol);el('small',pair.chosen||'No protocol selected',protocol);if(metric.caveat)el('small',metric.caveat,setting);select.addEventListener('change',()=>{state.groups[metric.id]=select.value;renderRadar();});
 if(!pair.shared.length)el('small','No shared setting; select a partial setting to inspect one model.',setting);
 [pair.a,pair.b].forEach(row=>{const td=el('td',row?`${row.score} ${row.unit||metric.unit||''}`:'Unavailable',tr);if(row)el('small',`${row.benchmark_version||'version unknown'} · ${row.split||'split unknown'} · ${row.metric||'metric unknown'} · ${row.comparability_status||'inspect protocol'}`,td);});const links=el('td',null,tr);const urls=[...(pair.a?.source_urls||[]),...(pair.b?.source_urls||[])];sources(links,urls);if(!urls.length)el('small','No matched evidence',links);});
}
function modelTaskStats(model,task) {const info=feedbackInfo(task.id,'model',model.id);const mapped=task.benchmark_ids||[];const covered=mapped.filter(mid=>availableScores(model.id,mid).length>0);return {benchmark:covered.length,mapped:mapped.length,experience:info.experience,count:info.count,covered,rows:info.rows};}
function eligibleModels() {let models=data.models.filter(familyMatch).filter(m=>!$('open-filter').checked||m.open_weight===true).filter(m=>$('license-filter').value==='all'||String(m.license||'unknown')===$('license-filter').value).filter(m=>$('params-filter').value==='all'||(m.parameters_total_b!==null&&m.parameters_total_b!==undefined&&Number(m.parameters_total_b)<=Number($('params-filter').value)));const task=taskMap.get(state.task)||data.tasks[0];const sort=$('matrix-sort').value;models.sort((a,b)=>{if(sort==='name')return a.name.localeCompare(b.name);if(sort==='parameters')return (a.parameters_total_b??Infinity)-(b.parameters_total_b??Infinity);if(!task)return 0;const sa=modelTaskStats(a,task),sb=modelTaskStats(b,task);return (sort==='experience'?sb.experience-sa.experience:sb.benchmark-sa.benchmark)||a.name.localeCompare(b.name);});return models;}
function renderMatrix() {
 hideTip();$('matrix-task').value=state.task;
 const eligible=eligibleModels(),choice=$('top-k').value,custom=$('custom-k');
 $('custom-k-label').hidden=choice!=='custom';custom.max=data.models.length;
 const requested=choice==='all'?eligible.length:choice==='custom'?Math.max(1,Math.min(data.models.length,Math.floor(Number(custom.value)||1))):Number(choice);
 const candidates=eligible.slice(0,requested),pages=Math.max(1,Math.ceil(candidates.length/PAGE_SIZE));state.page=Math.min(state.page,pages-1);const rows=candidates.slice(state.page*PAGE_SIZE,(state.page+1)*PAGE_SIZE);const tasks=data.tasks;
 const sortLabel=$('matrix-sort').selectedOptions[0].textContent;
 $('matrix-note').textContent=`Showing ${candidates.length} of ${eligible.length} eligible canonical candidates${choice==='all'?'':` · requested top ${requested}`} · ordered by ${sortLabel.toLowerCase()} for ${taskTitle(state.task)}. Ties use model name. Feedback uses shared period/platform filters; benchmark scores use the full prepared snapshot.`;
 const tray=clean($('comparison-tray'));
 [['A',state.modelA],['B',state.modelB]].forEach(([slot,id])=>{const span=el('span',null,tray);el('strong',`${slot} · `,span);el('span',modelMap.get(id)?.name||'Choose a model',span);});
 const compare=el('a','Compare A + B ↑',tray,'button');compare.href='#radar';
 $('page-status').textContent=candidates.length?`Candidates ${state.page*PAGE_SIZE+1}–${Math.min(candidates.length,(state.page+1)*PAGE_SIZE)} of ${candidates.length} · page ${state.page+1} / ${pages}`:'0 candidates';$('prev-page').disabled=state.page===0;$('next-page').disabled=state.page>=pages-1;
 if(!rows.length||!tasks.length){empty('matrix-chart','No candidates match the current metadata filters. Unknown parameter counts are excluded when a size cap is selected.');renderMatrixEvidence();return;}
 const left=250,cellW=112,rowH=38,top=95,w=left+tasks.length*cellW+10,h=top+rows.length*rowH+12;const s=svg('matrix-chart',w,h);const color=d3.scaleLinear().domain([0,1]).range(['#fbf7f4','#d89e8e']);
 tasks.forEach((t,i)=>{const title=s.append('text').attr('x',left+i*cellW+cellW/2).attr('y',top-15).attr('text-anchor','start').attr('transform',`rotate(-24 ${left+i*cellW+cellW/2} ${top-15})`).style('font-size','10px').style('fill',t.id===state.task?'#a23e46':'#75656b').attr('font-weight',t.id===state.task?700:400).text(t.label);activate(title,()=>selectTask(t.id),`Select task ${t.label}`);});
 rows.forEach((model,rowIndex)=>{const label=s.append('text').attr('x',left-12).attr('y',top+rowIndex*rowH+23).attr('text-anchor','end').style('fill',model.id===state.focusModel?'#a23e46':'#40333b').text(`${state.page*PAGE_SIZE+rowIndex+1}. ${model.id===state.modelA?'[A] ':model.id===state.modelB?'[B] ':''}${model.name.length>30?model.name.slice(0,29)+'…':model.name}`);activate(label,()=>focusModel(model.id),`Inspect model ${model.name}`);label.append('title').text(model.name);
 tasks.forEach((task,colIndex)=>{const info=modelTaskStats(model,task);const g=s.append('g').attr('transform',`translate(${left+colIndex*cellW},${top+rowIndex*rowH})`);g.append('rect').attr('width',cellW-3).attr('height',rowH-3).attr('rx',4).attr('fill',color(info.mapped?info.benchmark/info.mapped:0)).attr('stroke',model.id===state.focusModel&&task.id===state.task?'#a23e46':task.id===state.task?'#e0b9ac':'white').attr('stroke-width',model.id===state.focusModel&&task.id===state.task?2:1);g.append('text').attr('x',(cellW-3)/2).attr('y',22).attr('text-anchor','middle').style('font-size','10px').style('fill','#493840').text(info.benchmark||info.count?`B${info.benchmark} · E${info.experience} · C${info.count}`:'×');activate(g,()=>{state.task=task.id;state.focusModel=model.id;renderTasks();renderMatrix();renderEvolution();},`${model.name}, ${task.label}: ${info.benchmark} benchmark dimensions, ${info.experience} experience records, ${info.count} exact-model community feedback records. Inspect evidence.`);g.append('title').text(`${model.name}\n${task.label}\n${info.benchmark}/${info.mapped} mapped benchmark dimensions\n${info.experience} rule-inferred experience reports · ${info.count} eligible direct-model records`);});});renderMatrixEvidence();
}
function renderMatrixEvidence() {
 const panel=clean($('matrix-evidence'));const model=modelMap.get(state.focusModel||state.modelA),task=taskMap.get(state.task);if(!model||!task){el('p','Select a task–model cell to inspect its evidence and add the model to the radar.',panel);return;}
 const info=modelTaskStats(model,task);const familyInfo=feedbackInfo(task.id,'family',model.family_id);el('h3',`${task.label} · ${model.name}`,panel);el('p',`Benchmark coverage: ${info.benchmark}/${info.mapped} mapped dimensions. Rule-inferred experience records: ${fmt(info.experience)}. All eligible feedback attributed to this exact canonical model: ${fmt(info.count)}.`,panel);
 if(!eligibleModels().some(m=>m.id===model.id))el('p','This focused model is outside the current candidate filters. Its evidence remains available for inspection; it is not included in the eligible candidate count.',panel);
 if(!info.mapped)el('p','No quantitative benchmark mapping exists for this task in the prepared snapshot. B0 means no mapped evidence; it is not a zero capability score.',panel);
 el('p',task.definition,panel);
 el('p',task.mapping_rationale||'No verified task-to-benchmark rationale is available.',panel);const list=el('div',null,panel);(task.benchmark_ids||[]).forEach(mid=>{const metric=data.metrics.find(m=>m.id===mid);const scores=availableScores(model.id,mid);const p=el('p',`${metric?.label||mid}: ${scores.length?'available in '+scores.length+' setting(s)':'unavailable'}. `,list);scores.slice(0,3).forEach(row=>{el('span',`${row.score} ${row.unit||''} · ${row.metric||'metric unknown'} · `,p);safeLink(row.source_urls[0],'Source ↗',p);});});
 el('p','Repository or mention context supports attribution; it does not confirm that a report tested this exact variant. Records are not independent users, and author roles may be unknown.',panel);modelActions(panel,model.id);el('p',`Exact-model source excerpts (${fmt(info.count)} eligible records):`,panel);excerpts(panel,info.rows);
 if(familyInfo.count){const details=el('details',null,panel);el('summary',`${fmt(familyInfo.count)} family-only records for ${familyTitle(model.family_id)} — not evidence about this exact model`,details);el('p','Family attribution is retained separately; these records are not included in the model cell’s E or C counts.',details);excerpts(details,familyInfo.rows);}
}
function wire() {
 $('family-filter').addEventListener('change',e=>{state.family=e.target.value;updateShared();});$('platform-filter').addEventListener('change',e=>{state.platform=e.target.value;taskView.samplePage=0;renderTasks();renderMatrix();});
 [['task-measure','measure'],['task-mapping','mapping'],['task-sort','sort']].forEach(([id,key])=>$(id).addEventListener('change',event=>{taskView[key]=event.target.value;taskView.samplePage=0;renderTasks();}));
 $('task-prev').addEventListener('click',()=>{taskView.samplePage--;renderTaskSources();});
 $('task-next').addEventListener('click',()=>{taskView.samplePage++;renderTaskSources();});
 ['date-from','date-to'].forEach(id=>$(id).addEventListener('change',()=>{state.from=$('date-from').value;state.to=$('date-to').value;if(state.from&&state.to&&state.from>state.to){[state.from,state.to]=[state.to,state.from];$('date-from').value=state.from;$('date-to').value=state.to;}updateShared();}));
 $('reset-filters').addEventListener('click',()=>{state.family='all';state.platform='all';state.from=data.periods[0]||'';state.to=data.periods.at(-1)||'';$('family-filter').value='all';$('platform-filter').value='all';$('date-from').value=state.from;$('date-to').value=state.to;updateShared();});
 ['growth-mode','repo-type'].forEach(id=>$(id).addEventListener('change',renderGrowth));['node-labels','relationship-filter'].forEach(id=>$(id).addEventListener('change',renderEvolution));
 ['model-a','model-b'].forEach((id,i)=>$(id).addEventListener('change',e=>{state[i?'modelB':'modelA']=e.target.value;state.groups={};renderRadar();renderEvolution();renderMatrix();}));
 $('radar-defaults').addEventListener('click',()=>{
  [state.modelA,state.modelB]=data.radar_defaults.pair;state.groups={...data.radar_defaults.groups};
  $('model-a').value=state.modelA;$('model-b').value=state.modelB;renderRadar();renderEvolution();renderMatrix();
 });
 $('radar-swap').addEventListener('click',()=>{
  [state.modelA,state.modelB]=[state.modelB,state.modelA];$('model-a').value=state.modelA;$('model-b').value=state.modelB;
  renderRadar();renderEvolution();renderMatrix();
 });
 $('matrix-task').addEventListener('change',event=>selectTask(event.target.value));
 ['license-filter','params-filter','open-filter','matrix-sort','top-k'].forEach(id=>$(id).addEventListener('change',()=>{state.page=0;renderMatrix();}));
 $('custom-k').addEventListener('change',()=>{const input=$('custom-k');input.value=Math.max(1,Math.min(data.models.length,Math.floor(Number(input.value)||1)));state.page=0;renderMatrix();});
 $('custom-k').addEventListener('input',()=>{if($('custom-k').validity.valid&&$('custom-k').value){state.page=0;renderMatrix();}});
 $('prev-page').addEventListener('click',()=>{state.page--;renderMatrix();});$('next-page').addEventListener('click',()=>{state.page++;renderMatrix();});
}
function init() {
 modelMap=new Map(data.models.map(m=>[m.id,m]));taskMap=new Map(data.tasks.map(t=>[t.id,t]));colors=d3.scaleOrdinal().domain(data.families.map(f=>f.id)).range(data.families.map((f,i)=>f.id==='unknown'?'#a49c98':d3.hcl((i*137.508)%360,36,56).formatHex()));
 const metricMap=new Map(data.metrics.map(metric=>[metric.id,metric]));
 // Index qualified scores once; cache feedback aggregates per shared filter state.
 scoreIndex=d3.group(data.scores.filter(row=>metricMap.has(row.benchmark_id)&&normalized(row,metricMap.get(row.benchmark_id))!==null),row=>row.model_id,row=>row.benchmark_id);
 state.from=data.periods[0]||'';state.to=data.periods.at(-1)||'';const mappedTasks=data.tasks.filter(t=>(t.benchmark_ids||[]).length&&feedbackInfo(t.id).count>0);state.task=(mappedTasks.length?mappedTasks:data.tasks).slice().sort((a,b)=>feedbackInfo(b.id).count-feedbackInfo(a.id).count)[0]?.id;
 let bestPair=data.radar_defaults?.pair?.every(id=>modelMap.has(id))?data.radar_defaults.pair:null,bestCoverage=bestPair?Infinity:-1;if(!bestPair)for(let i=0;i<data.models.length;i++)for(let j=i+1;j<data.models.length;j++){const a=data.models[i].id,b=data.models[j].id;const shared=data.metrics.filter(m=>{const aa=availableScores(a,m.id),bb=availableScores(b,m.id);return aa.some(r=>bb.some(q=>q.comparability_group===r.comparability_group));}).length;if(shared>bestCoverage){bestCoverage=shared;bestPair=[a,b];}}
 state.groups={...data.radar_defaults?.groups};state.modelA=bestPair?.[0]||data.models[0]?.id;state.modelB=bestPair?.[1]||data.models[1]?.id||state.modelA;state.focusModel=state.modelA;
 $('radar-defaults').disabled=!data.radar_defaults?.pair?.every(id=>modelMap.has(id));
 setOptions('matrix-task',data.tasks.map(task=>[task.id,task.label]),state.task);
 setOptions('family-filter',[['all','All families'],...data.families.map(f=>[f.id,f.label])]);setOptions('platform-filter',[['all','All platforms'],...[...new Set(data.feedback_totals.map(r=>r.platform))].sort().map(p=>[p,p])]);setOptions('repo-type',[['all','All repository types'],...[...new Set(data.growth.repository_creation.map(r=>r.repo_type))].sort().map(t=>[t,t])]);setOptions('relationship-filter',[['all','All recorded types'],...[...new Set(data.relationships.map(r=>r.relationship_type))].sort().map(t=>[t,t])]);
 setOptions('license-filter',[['all','All / undisclosed'],...[...new Set(data.models.map(m=>String(m.license||'unknown')))].sort().map(l=>[l,l])]);const modelOptions=data.models.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(m=>[m.id,m.name]);setOptions('model-a',modelOptions,state.modelA);setOptions('model-b',modelOptions,state.modelB);$('date-from').value=state.from;$('date-to').value=state.to;
 const summary=clean($('summary'));[[data.counts.repositories,'unique MLLM repositories'],[data.models.length,'canonical comparison models'],[data.counts.feedback,'cleaned community feedback records'],[data.counts.benchmark_rows,'preserved benchmark measurements']].forEach(([count,label])=>{const item=el('div',null,summary);el('strong',fmt(count),item);el('span',label,item);});
 const warnings=clean($('warnings'));[...data.warnings,...data.notes].forEach(note=>el('p',note,warnings));el('p',`Community source roles: ${Object.entries(data.feedback_roles||{}).map(([role,count])=>`${role} ${fmt(count)}`).join(' · ')}. Counts describe records, not independently verified users.`,warnings);$('snapshot').textContent=`Source snapshot through ${data.generated_at}. Eight-axis canonical model coverage: ${data.metrics.map(m=>`${m.label} ${data.coverage[m.id]||0}`).join(' · ')}.`;
 $('load-status').textContent=data.missing_inputs.length?`Partial handoff: missing ${data.missing_inputs.join(', ')}. Empty states below identify unsupported evidence.`:`Live prepared snapshot · ${fmt(data.counts.repositories)} repositories and ${fmt(data.counts.feedback)} eligible community feedback records; ${fmt(data.counts.task_labeled_feedback)} have task labels. Review evidence limits before interpretation.`;
 wire();updateShared();renderRadar();
}
async function load() {try {if(typeof d3==='undefined')throw new Error('D3 could not load. Check the network or serve a local D3 build.');const response=await fetch('data/final/view_data.json');if(!response.ok)throw new Error(`Prepared view data unavailable (HTTP ${response.status}). Run python3 scripts/build_final_views.py first.`);data=await response.json();(data.feedback_buckets||[]).forEach(bucket=>bucket.excerpts=(bucket.excerpt_ids||[]).map(id=>data.excerpt_lookup?.[id]).filter(Boolean));if(!Array.isArray(data.models)||!Array.isArray(data.tasks)||!data.growth)throw new Error('Unsupported view_data.json schema. Rebuild the prepared view data.');init();}catch(error){$('load-status').textContent=`Unable to load the evidence explorer: ${error.message}`;$('load-status').classList.add('error');document.querySelectorAll('button,select,input').forEach(node=>node.disabled=true);console.error(error);}}
load();
})();
