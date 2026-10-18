import {normalized, available, protocolGroups, pairScores, eligible, matchFeedback, concernCount, sharedCoverage, comparisonChoices, bestComparisonPartner, paretoFrontier} from './explorer-core.mjs';

const $=id=>document.getElementById(id), fmt=n=>Number(n||0).toLocaleString('en-US');
const state={family:'all',platform:'all',experience:'all',cloud:'all',concern:'documents',task:'visual-qa',stage:0,focus:null,candidateFocus:null,a:null,b:null,page:0,groups:{},growthFocus:null};
let data, models, tasks, metrics, color, timer, evolutionSvg;
const palette=['#ea4b73','#00a0b5','#d7a119','#7955d9','#36a46b','#ee8336','#467bdf','#c24bb8','#e73e66','#18a7a0'];
const typeColors={original_release:'#13a694',fine_tune:'#f2aa24',adapter:'#8b62df',quantization:'#f36783',unknown:'#aab5c7',canonical_release:'#13a694'};
const typeNames={original_release:'Original distribution',fine_tune:'Fine-tune',adapter:'Adapter',quantization:'Quantization',unknown:'Unclassified',canonical_release:'Canonical release'};
const clear=n=>{n.replaceChildren();return n;};
function el(tag,text,parent,cls){const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;if(parent)parent.append(n);return n;}
function link(url,text,parent){try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))return;const a=el('a',text,parent);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a;}catch{}}
function opts(id,items,selected){const n=clear($(id));for(const [value,label]of items){const o=el('option',label,n);o.value=value;}if(items.some(([v])=>v===selected))n.value=selected;return n.value;}
function svg(id,w,h){return d3.select(clear($(id))).append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('role','group');}
function empty(id,text){el('p',text,clear($(id)),'empty');}
function text(s,x,y,t,cls){return s.append('text').attr('x',x).attr('y',y).attr('class',cls||null).text(t);}
function wrap(sel,width){sel.each(function(){const t=d3.select(this),words=t.text().split(/\s+/),x=t.attr('x');t.text('');let line=[],span=t.append('tspan').attr('x',x).attr('dy',0);for(const word of words){line.push(word);span.text(line.join(' '));if(span.node().getComputedTextLength()>width&&line.length>1){line.pop();span.text(line.join(' '));line=[word];span=t.append('tspan').attr('x',x).attr('dy','1.2em').text(word);}}});}
function active(sel,callback,label){sel.attr('role','button').attr('tabindex',0).attr('aria-label',label).on('click',callback).on('keydown',(e,d)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();callback(e,d);}});}
function tip(e,t){const n=$('tooltip');n.textContent=t;n.hidden=false;n.style.left=`${Math.max(8,Math.min(innerWidth-325,e.clientX+14))}px`;n.style.top=`${Math.max(8,Math.min(innerHeight-145,e.clientY+12))}px`;}
const hideTip=()=>{$('tooltip').hidden=true;};
// Native modal dialogs keep attention on one figure and provide keyboard focus containment.
function openModal(id,trigger=document.activeElement){
 const dialog=$(id);if(!dialog)return;hideTip();stopStory();
 const previous=document.querySelector('dialog[open]');
 const fallback=trigger?.closest?.('section')?.id||previous?.dataset.returnSection||'';
 if(previous&&previous!==dialog)previous.close();
 dialog.returnFocus=trigger;dialog.dataset.returnSection=fallback;
 if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');
 dialog.querySelector('.modal-header h2')?.focus({preventScroll:true});
}
function closeModal(id){const d=$(id);if(d?.open)d.close();}
function wireDialogs(){
 document.querySelectorAll('[data-modal-target]').forEach(b=>b.onclick=()=>openModal(b.dataset.modalTarget,b));
 document.querySelectorAll('dialog.info-dialog').forEach(d=>{
  d.querySelector('.modal-close').onclick=()=>d.close();
  d.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const controls=[...d.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);if(!controls.length)return;const i=controls.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&(i<0||i===controls.length-1)){e.preventDefault();controls[0].focus();}});
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.querySelector('.modal-panel').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
  d.addEventListener('close',()=>{
   if(document.querySelector('dialog[open]'))return;document.body.classList.remove('modal-open');
   if(d.returnFocus?.isConnected)d.returnFocus.focus({preventScroll:true});
   else if(d.dataset.returnSection)$(d.dataset.returnSection)?.querySelector('button,input,select')?.focus({preventScroll:true});
  });
 });
}
const duration=()=> $('reduce-motion').checked?0:750;
const familyName=id=>data.families.find(f=>f.id===id)?.label||id;
const param=m=>m.parameters_total_b==null?'size unknown':`${Number(m.parameters_total_b).toLocaleString('en-US',{maximumFractionDigits:2})}B parameters`;
const total=(rows,key='count')=>d3.sum(rows,r=>r[key]||0);
const feedbackRows=(task,scope='all',entity='')=>data.feedback_buckets.filter(r=>r.task_id===task&&r.scope===scope&&r.entity_id===entity);
function settingName(row){if(!row)return 'No measurement';if(row.source_type==='openvlm_baseline')return `OpenVLM · ${row.split||'unknown split'} · settings incomplete`;let src='Official card';try{src=new URL(row.source_urls[0]).pathname.split('/').pop();}catch{}return `${src} · ${row.split||'split unknown'}`;}
function sources(parent,urls){const n=el('div',null,parent,'evidence-links');[...new Set(urls.filter(Boolean))].slice(0,4).forEach((u,i)=>link(u,`Source ${i+1} ↗`,n));}
function showExcerpts(parent,buckets,lookup=data.excerpt_lookup,limit=2){const keys=[...new Set(buckets.flatMap(b=>b.excerpt_ids||[]))];const rows=keys.map(id=>lookup[id]).filter(r=>r?.text?.length>20).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))).slice(0,limit);if(!rows.length){el('p','No excerpt is available in the capped public sample for these filters; counts still use the complete cleaned corpus.',parent,'chart-note');return;}const box=el('div',null,parent,'excerpts');for(const r of rows){const n=el('article',null,box,'excerpt');el('small',`${r.platform} · ${String(r.published_at).slice(0,10)} · ${r.attribution_level} association`,n);el('blockquote',r.text+'…',n);el('small',`${String(r.experience_type||'discussion').replaceAll('_',' ')} · rule-generated label · shortened excerpt`,n);link(r.source_url,'Read full context ↗',n);}}
function setTask(id){if(!supportedTask(id))return;state.task=id;state.candidateFocus=null;state.page=0;const c=data.concerns.find(c=>c.task_id===id);if(c)state.concern=c.id;prepareTaskMeasure();renderCloud();renderMapping();}
function selectModel(id,trigger){state.focus=id;renderEvolution();openModal('dialog-model',trigger);}
function refresh(){state.page=0;renderGrowth();renderCloud();prepareEvolutionProtocol();renderEvolution();prepareTaskProtocol();renderMapping();renderRadar();}

// 01 — category reordering moves the selected area to a shared zero baseline.
function renderGrowth(){
 const mode=$('growth-mode').value;let group=$('growth-group').value;
 $('growth-group').disabled=mode==='verified_release';if(mode==='verified_release')group='family';
 const all=data.growth[mode].filter(r=>(state.family==='all'||r.family_id===state.family)&&r.month!=='unknown'&&r.count>0);
 if(!all.length){$('growth-total').textContent='No dated records';empty('growth-chart','No dated records for this family. Choose another family.');clear($('growth-legend'));return;}
 const [first,last]=d3.extent(all,r=>r.month),from=mode==='repository_creation'&&first<'2023-01'?'2023-01':first,to=last<from?from:last;
 const through=all.filter(r=>r.month<=to),n=total(through);
 $('growth-total').textContent=`${fmt(n)} ${mode==='verified_release'?'verified model releases':'model repositories'} through ${to}`;
 const sums=d3.rollups(all,v=>total(v),r=>group==='type'?r.repo_type:r.family_id).sort((a,b)=>b[1]-a[1]);const top=sums.slice(0,7).map(([k])=>k);
 const key=r=>group==='type'?r.repo_type:(top.includes(r.family_id)?r.family_id:'Other families');
 const keys=[...new Set(all.map(key))].sort((a,b)=>total(all.filter(r=>key(r)===b))-total(all.filter(r=>key(r)===a)));
 if(state.growthFocus&&!keys.includes(state.growthFocus))state.growthFocus=null;
 if(state.growthFocus)keys.sort((a,b)=>(a===state.growthFocus?-1:b===state.growthFocus?1:0));
 const name=k=>group==='type'?(typeNames[k]||k):familyName(k),fill=k=>group==='type'?typeColors[k]:k==='Other families'?'#aab5c7':color(k);
 const legend=clear($('growth-legend'));keys.forEach(k=>{const b=el('button',null,legend);b.setAttribute('aria-pressed',String(k===state.growthFocus));const i=el('i',null,b);i.style.background=fill(k);el('span',`${name(k)} · ${fmt(total(through.filter(r=>key(r)===k)))}`,b);b.onclick=()=>{state.growthFocus=state.growthFocus===k?null:k;renderGrowth();};});$('growth-unfocus').hidden=!state.growthFocus;
 const parse=d3.utcParse('%Y-%m'),format=d3.utcFormat('%Y-%m');const months=d3.utcMonth.range(parse(from),d3.utcMonth.offset(parse(to),1));
 // Earlier repository records remain in the baseline when the display begins in 2023.
 const running=Object.fromEntries(keys.map(k=>[k,total(all.filter(r=>r.month<from&&key(r)===k))]));const inc=d3.rollup(all,v=>total(v),r=>r.month,key);
 const points=months.map(date=>{const month=format(date),p={date,month,total:0};for(const k of keys){running[k]+=inc.get(month)?.get(k)||0;p[k]=running[k];p.total+=p[k];}return p;});
 const observations=points.slice();if(points.length===1)points.push({...points[0],date:d3.utcMonth.offset(points[0].date,1)});
 const w=1140,h=450,m={l:65,r:24,t:25,b:100};let s=d3.select('#growth-chart svg');if(s.empty())s=svg('growth-chart',w,h);
 s.attr('data-first-month',first).attr('data-last-month',last).attr('data-visible-from',from).attr('data-visible-to',to).attr('data-total',n).attr('data-earlier-count',total(all.filter(r=>r.month<from)));
 const x=d3.scaleUtc().domain(d3.extent(points,p=>p.date)).range([m.l,w-m.r]);const y=d3.scaleLinear().domain([0,d3.max(points,p=>p.total)||1]).nice().range([h-m.b,m.t]);
 s.selectAll('.axis,.grid,.overview,.label').remove();s.append('g').attr('class','grid').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(w-m.l-m.r)).tickFormat('')).call(g=>g.select('.domain').remove());
 const series=d3.stack().keys(keys)(points),area=d3.area().x(d=>x(d.data.date)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveMonotoneX);
 const paths=s.selectAll('path.area').data(series,d=>d.key).join('path').attr('class','area').attr('fill',d=>fill(d.key)).attr('fill-opacity',.9).attr('stroke',d=>fill(d.key)).attr('stroke-width',1.1);
 paths.interrupt().transition().duration(duration()).attr('d',area);paths.on('pointermove',(e,d)=>{const date=format(d3.utcMonth.round(x.invert(d3.pointer(e,s.node())[0]))),p=points.find(p=>p.month===date)||points.at(-1);tip(e,`${name(d.key)} · through ${p.month}\n${fmt(p[d.key])} cumulative records\nClick to compare from the baseline`);}).on('pointerleave',hideTip).on('click',(e,d)=>{state.growthFocus=d.key;hideTip();renderGrowth();});
 const ticks=from===to?[parse(from)]:[parse(from),...x.ticks(5).filter(d=>x(d)>m.l+95&&x(d)<w-m.r-95),parse(to)];
 s.append('g').attr('class','axis').attr('transform',`translate(0,${h-m.b})`).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.utcFormat('%b %Y'))).selectAll('.tick text').attr('text-anchor',d=>+d===+parse(from)?'start':+d===+parse(to)?'end':'middle');s.append('g').attr('class','axis').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')));
 text(s,m.l,15,'Cumulative count','label');
 const oy=d3.scaleLinear().domain([0,n||1]).range([h-25,h-65]),overview=s.append('g').attr('class','overview inspection-strip');
 overview.append('rect').attr('x',m.l).attr('y',h-70).attr('width',w-m.l-m.r).attr('height',48).attr('rx',5).attr('fill','#fff0f4');
 overview.append('path').attr('d',d3.area().x(d=>x(d.date)).y0(h-25).y1(d=>oy(d.total)).curve(d3.curveMonotoneX)(points)).attr('fill','#f2a4b4');
 const marker=overview.append('g').attr('class','month-marker').attr('pointer-events','none').attr('visibility','hidden');
 const crosshair=marker.append('line').attr('y1',m.t).attr('y2',h-25).attr('stroke','#9c2f62').attr('stroke-width',1.3).attr('stroke-dasharray','3 4');
 const dot=marker.append('circle').attr('r',5).attr('fill','#9c2f62').attr('stroke','#fff').attr('stroke-width',2);
 const reading=text(marker,m.l,h-5,'').attr('class','month-reading').style('font-size','12px').style('font-weight',600);
 let inspected=observations.length-1;
 const inspector=overview.append('rect').attr('class','month-inspector').attr('x',m.l).attr('y',h-70).attr('width',w-m.l-m.r).attr('height',48).attr('rx',5).attr('fill','transparent').attr('tabindex',0).attr('role','slider').attr('aria-label','Inspect a month. Use left and right arrows; Home and End jump to the first and last month.').attr('aria-orientation','horizontal').attr('aria-valuemin',0).attr('aria-valuemax',observations.length-1).attr('aria-valuenow',inspected).attr('aria-valuetext',`${observations[inspected].month}: ${fmt(observations[inspected].total)} cumulative records`);
 function inspectMonth(index,event){
  inspected=Math.max(0,Math.min(observations.length-1,index));const p=observations[inspected],value=`${p.month} · ${fmt(p.total)} cumulative ${mode==='verified_release'?'releases':'repositories'}`;
  marker.attr('visibility','visible');crosshair.attr('x1',x(p.date)).attr('x2',x(p.date));dot.attr('cx',x(p.date)).attr('cy',y(p.total));reading.text(value);inspector.attr('aria-valuenow',inspected).attr('aria-valuetext',value);s.attr('data-inspected-month',p.month).attr('data-inspected-total',p.total);
  if(event&&Number.isFinite(event.clientX))tip(event,value+(state.growthFocus?`\n${name(state.growthFocus)}: ${fmt(p[state.growthFocus])}`:''));
 }
 function inspectPointer(event){const date=format(d3.utcMonth.round(x.invert(d3.pointer(event,s.node())[0]))),index=observations.findIndex(p=>p.month===date);inspectMonth(index<0?(date<from?0:observations.length-1):index,event);}
 inspector.on('pointermove',inspectPointer).on('pointerdown',inspectPointer).on('pointerleave',hideTip).on('focus',()=>inspectMonth(inspected)).on('keydown',event=>{const next=event.key==='Home'?0:event.key==='End'?observations.length-1:event.key==='ArrowLeft'?inspected-1:event.key==='ArrowRight'?inspected+1:event.key==='PageUp'?inspected+12:event.key==='PageDown'?inspected-12:null;if(next===null)return;event.preventDefault();inspectMonth(next);});
}

// 02 — custom collision-tested phrase packing, with an exact ranked companion.
function renderCloud(){
 const ranked=data.concerns.map(c=>({...c,count:concernCount(data,c.id,state)})).sort((a,b)=>b.count-a.count);
 const denominator=total(data.feedback_totals.filter(r=>matchFeedback(r,state)));$('task-denominator').textContent=`${fmt(denominator)} source records in this selection. Each phrase counts distinct matching records; a record can mention several concerns. “Reported use or problems” includes rule-inferred observations and problem reports. Labels are not human-validated; these support forums do not represent all users.`;
 const list=clear($('task-ranked'));ranked.forEach(c=>{const b=el('button',null,list,'rank-row');b.setAttribute('aria-pressed',String(c.id===state.concern));b.style.setProperty('--bar',`${100*c.count/(ranked[0]?.count||1)}%`);el('span',c.label,b);el('strong',fmt(c.count),b);b.onclick=()=>selectConcern(c.id,b);});
 const mobile=innerWidth<650,w=mobile?420:1100,h=mobile?520:430,s=svg('task-cloud',w,h);const scale=d3.scalePow().exponent(.85).domain([0,ranked[0]?.count||1]).range([15,mobile?48:78]);const placed=[];
 ranked.filter(c=>c.count>0).forEach((c,index)=>{
  const node=text(s,0,0,c.label).attr('text-anchor','middle').attr('data-concern',c.id).style('font-weight',c.id===state.concern?750:650).style('fill',c.kind==='practical'?'#df396d':'#008daa');let size=scale(c.count),location;
  for(let pass=0;pass<7&&!location;pass++){
   if(pass===6)size=15;
   node.style('font-size',`${size}px`);const box=node.node().getBBox(),bw=box.width+18,bh=box.height+14;
   for(let j=0;j<9000;j++){const angle=j*.39+index*.5,r=(mobile?4.4:6.4)*Math.sqrt(j),x=w/2+Math.cos(angle)*r,y=h/2+Math.sin(angle)*r*(mobile?.9:.44);const b={x:x+box.x-9,y:y+box.y-7,w:bw,h:bh};if(b.x<8||b.x+bw>w-8||b.y<10||b.y+bh>h-10)continue;if(placed.some(p=>b.x<p.x+p.w&&b.x+b.w>p.x&&b.y<p.y+p.h&&b.y+b.h>p.y))continue;location={x,y,b};break;}size=Math.max(15,size*.88);
  }
  if(!location){node.remove();return;}placed.push(location.b);node.attr('x',location.x).attr('y',location.y).attr('text-decoration',c.id===state.concern?'underline':null);active(node,e=>selectConcern(c.id,e.currentTarget),`${c.label}, ${fmt(c.count)} records. Inspect concern.`);node.on('pointermove',e=>tip(e,`${c.label}\n${fmt(c.count)} distinct records\nClick for source context`)).on('pointerleave',hideTip);
 });
 if(!ranked.some(c=>c.count))text(s,w/2,h/2,'No matching concern labels in this selection.').attr('text-anchor','middle');
 const c=data.concerns.find(c=>c.id===state.concern),panel=clear($('task-evidence'));if(c){
  el('h3',c.label,panel);const count=concernCount(data,c.id,state);
  el('p',fmt(count)+' matching records · from '+fmt(data.counts.feedback)+' retained posts and comments',panel,'modal-count');
  el('p',c.rationale,panel);
  if(c.task_id&&supportedTask(c.task_id)){const b=el('button','Find models for this task',panel,'button primary');b.onclick=()=>{setTask(c.task_id);closeModal('dialog-concern');document.dispatchEvent(new CustomEvent('story:navigate',{detail:{id:'matrix'}}));};}
  else if(c.task_id)el('p','This interest remains in the feedback corpus, but the collected benchmarks cannot support a measured model comparison for it.',panel,'chart-note');
  const buckets=data.concern_buckets.filter(r=>r.concern_id===c.id&&r.scope==='all'&&matchFeedback(r,state));
  const samples=state.experience==='experience'?Object.fromEntries(Object.entries(data.concern_excerpts).filter(([,r])=>['usage_observation','problem_report'].includes(r.experience_type))):data.concern_excerpts;
  showExcerpts(panel,buckets,samples);
  el('p','Counts use distinct source records; these shortened examples are a small source-linked sample. Labels are rule-generated, not human-validated.',panel,'chart-note');
 }
}
function selectConcern(id,trigger){hideTip();state.concern=id;renderCloud();const replacement=document.querySelector(`#task-cloud [data-concern="${CSS.escape(id)}"]`);openModal('dialog-concern',replacement||$('tasks').querySelector('button'));}

// 03 — one stable model mark across time, hierarchy, and score distributions.
function prepareEvolutionProtocol(){
 const mid=$('evolution-metric').value,rows=data.models.filter(m=>state.family==='all'||m.family_id===state.family);
 const groups=protocolGroups(data,mid,rows.map(m=>m.id)).map(g=>({...g,count:rows.filter(m=>available(data,m.id,mid).some(r=>r.comparability_group===g.id)).length})).filter(g=>g.count>0).sort((a,b)=>b.count-a.count);
 const sourceName=r=>r.source_type==='openvlm_baseline'?`OpenVLM${r.split&&r.split!=='unknown'?` · ${r.split}`:''}`:settingName(r).replace(' · unknown','').replace(' · split unknown','');
 opts('evolution-protocol',groups.length?groups.map(g=>[g.id,`${sourceName(g.row)} · ${g.count} models`]):[['','No measurements']],$('evolution-protocol').value);
}
function renderEvolution(){
 const rows=data.models.filter(m=>state.family==='all'||m.family_id===state.family),families=[...new Set(rows.map(m=>m.family_id))].sort(),w=1140,h=state.stage===2?Math.max(300,100+families.length*62):state.stage===1?570:490,margin={l:65,r:65,t:50,b:70};const positions=new Map();
 prepareEvolutionProtocol();
 if(!evolutionSvg)evolutionSvg=svg('evolution-chart',w,h);const s=evolutionSvg.attr('viewBox',`0 0 ${w} ${h}`);s.selectAll('.stage-decoration').remove();const deco=s.insert('g',':first-child').attr('class','stage-decoration');const mid=$('evolution-metric').value,group=$('evolution-protocol').value,metric=metrics.get(mid);
 const query=$('model-search').value.trim().toLowerCase();$('evolution-metric').disabled=state.stage!==2;$('evolution-protocol').disabled=state.stage!==2;if($('evolution-performance-controls')){$('evolution-performance-controls').hidden=state.stage!==2;$('evolution-performance-controls').classList.toggle('hidden',state.stage!==2);}
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.stage===state.stage)));
 if(!rows.length){evolutionSvg=null;empty('evolution-chart','This family has repository records but no canonical comparison model. Choose another family or reset exploration.');clear($('evolution-legend'));$('evolution-narrative').textContent='No curated comparison models in this family.';renderModelEvidence();return;}
 if(state.stage===0){
  const dated=rows.filter(m=>m.release_date&&m.release_status?.includes('verified')&&!m.release_status.includes('unverified'));const dates=d3.extent(dated,m=>new Date(m.release_date));if(dated.length&&+dates[0]===+dates[1]){dates[0]=d3.utcMonth.offset(dates[0],-1);dates[1]=d3.utcMonth.offset(dates[1],1);}const x=d3.scaleUtc().domain(dated.length?dates:[new Date('2023-01-01'),new Date('2026-10-17')]).range([margin.l,w-margin.r]);const lanes=new Map();
  for(const m of [...dated].sort((a,b)=>a.release_date.localeCompare(b.release_date))){const px=x(new Date(m.release_date));let lane=0;while((lanes.get(lane)||[]).some(v=>Math.abs(v-px)<22))lane++;if(!lanes.has(lane))lanes.set(lane,[]);lanes.get(lane).push(px);positions.set(m.id,{x:px,y:210+(lane%2?-1:1)*Math.ceil(lane/2)*24,r:9});}
  const unknown=rows.filter(m=>!positions.has(m.id));unknown.forEach((m,i)=>positions.set(m.id,{x:65+i*28,y:422,r:9}));
  deco.append('g').attr('transform','translate(0,345)').call(d3.axisBottom(x).ticks(7).tickFormat(d3.utcFormat('%b %Y')));deco.selectAll('line.year').data(x.ticks(7)).join('line').attr('x1',x).attr('x2',x).attr('y1',55).attr('y2',345).attr('stroke','#dfd0c9').attr('stroke-dasharray','3 5');text(deco,65,32,'Verified release date','mark-label');if(unknown.length)text(deco,65,395,`${unknown.length} undated models`);
  $('evolution-narrative').textContent=`${dated.length} dated releases. Each dot is a model; select one for details.`;
 }else if(state.stage===1){
  const root=d3.hierarchy({children:families.map(f=>({id:f,children:rows.filter(m=>m.family_id===f).map(m=>({id:m.id}))}))}).sum(d=>d.children?0:1).sort((a,b)=>b.value-a.value);
  d3.pack().size([w-160,h-85]).padding(21)(root);
  root.children?.forEach(f=>{const cx=f.x+80,cy=f.y+35;deco.append('circle').attr('cx',cx).attr('cy',cy).attr('r',f.r).attr('fill',color(f.data.id)).attr('fill-opacity',.07).attr('stroke',color(f.data.id)).attr('stroke-opacity',.4);const label=familyName(f.data.id).replace('MiniCPM-V / MiniCPM-o','MiniCPM').replace('Phi Vision / Multimodal','Phi Vision');text(deco,cx,cy-f.r+15,`${label} · ${f.value}`,'mark-label').attr('text-anchor','middle').style('font-size','11px').append('title').text(familyName(f.data.id));});
  root.leaves().forEach(l=>positions.set(l.data.id,{x:l.x+80,y:l.y+35,r:Math.min(l.r,20)}));
  $('evolution-narrative').textContent=`${rows.length} models, ${families.length} families. Follow the same dots as they regroup by family.`;
 }else{
  const x=d3.scaleLinear().domain([0,metric?.range_max||100]).range([230,w-125]);const y=d3.scalePoint().domain(families).range([80,h-100]).padding(.4);const occupied=new Map(),missing=new Map();let measured=0;
  for(const m of rows){const r=available(data,m.id,mid).find(r=>r.comparability_group===group);let px=r?x(r.score):w-55;if(!r){const i=missing.get(m.family_id)||0;missing.set(m.family_id,i+1);const count=rows.filter(v=>v.family_id===m.family_id&&!available(data,v.id,mid).some(v=>v.comparability_group===group)).length;positions.set(m.id,{x:w-84+(i%4)*18,y:y(m.family_id)+(Math.floor(i/4)-(Math.ceil(count/4)-1)/2)*18,r:7.5});continue;}if(r)measured++;const k=m.family_id;let lane=0;while((occupied.get(k)||[]).some(p=>Math.abs(p.x-px)<21&&p.lane===lane))lane++;if(!occupied.has(k))occupied.set(k,[]);occupied.get(k).push({x:px,lane});positions.set(m.id,{x:px,y:y(k)+(lane%2?-1:1)*Math.ceil(lane/2)*17,r:7.5});}
  families.forEach(f=>{deco.append('line').attr('x1',230).attr('x2',w-115).attr('y1',y(f)).attr('y2',y(f)).attr('stroke','#e4d6d2');text(deco,215,y(f)+4,familyName(f).replace('MiniCPM-V / MiniCPM-o','MiniCPM').replace('Phi Vision / Multimodal','Phi Vision'),'mark-label').attr('text-anchor','end').style('fill',color(f));});deco.append('g').attr('transform',`translate(0,${h-50})`).call(d3.axisBottom(x).ticks(6));text(deco,230,30,`${metric?.label||''} · ${metric?.unit||'score'} →`,'mark-label');text(deco,w-55,30,'Unmeasured').attr('text-anchor','middle').style('font-size','11px');deco.append('line').attr('x1',w-100).attr('x2',w-100).attr('y1',45).attr('y2',h-65).attr('stroke','#cbbab4').attr('stroke-dasharray','4 4');
  $('evolution-narrative').textContent=`${measured} of ${rows.length} models measured here. Farther right = higher score; unmeasured models sit separately.`;
 }
 if(query){const matches=rows.filter(m=>m.name.toLowerCase().includes(query)).length;$('evolution-narrative').textContent+=` ${matches} search ${matches===1?'match':'matches'} highlighted.`;}
 const nodes=s.selectAll('circle.model-dot').data(rows,m=>m.id).join(enter=>enter.append('circle').attr('class','model-dot').attr('cx',w/2).attr('cy',h/2).attr('r',0),update=>update,exit=>exit.remove()).attr('fill',m=>color(m.family_id)).attr('stroke',m=>m.id===state.focus?'#322e35':'#fffaf5').attr('stroke-width',m=>m.id===state.focus?3:1.5).attr('opacity',m=>!query||m.name.toLowerCase().includes(query)?1:.16);
 nodes.interrupt().transition().duration(duration()).attr('cx',m=>positions.get(m.id)?.x??0).attr('cy',m=>positions.get(m.id)?.y??0).attr('r',m=>positions.get(m.id)?.r??8);
 active(nodes,(e,m)=>{hideTip();selectModel(m.id,e.currentTarget);},m=>`${m.name}. ${familyName(m.family_id)}. Open model details.`);nodes.on('pointermove',(e,m)=>{const r=available(data,m.id,mid).find(r=>r.comparability_group===group);tip(e,`${m.name}\n${familyName(m.family_id)} · ${param(m)}\n${state.stage===2?`${metric?.label}: ${r?r.score:'unavailable in this group'}`:`Release: ${m.release_date||'unverified/unknown'}`}\nSelect for details`);}).on('pointerleave',hideTip);
 const labels=state.stage===1?[]:rows.filter(m=>m.id===state.focus||query&&m.name.toLowerCase().includes(query)).slice(0,6);const ls=s.selectAll('text.dot-label').data(labels,m=>m.id).join('text').attr('class','dot-label mark-label').style('pointer-events','none').style('font-size','10px').text(m=>m.name);ls.interrupt().transition().duration(duration()).attr('x',m=>positions.get(m.id).x).attr('y',m=>positions.get(m.id).y-positions.get(m.id).r-8).attr('text-anchor',m=>positions.get(m.id).x>w-200?'end':positions.get(m.id).x<200?'start':'middle');
 const legend=clear($('evolution-legend'));legend.hidden=state.stage!==0;families.forEach(f=>{const item=el('span',null,legend);el('i',null,item).style.background=color(f);el('span',`${familyName(f)} · ${rows.filter(m=>m.family_id===f).length}`,item);});renderModelEvidence();
}
function renderModelEvidence(){
 const m=models.get(state.focus),p=clear($('model-evidence'));if(!m||state.family!=='all'&&m.family_id!==state.family){el('p','Select a dot to inspect a model.',p);return;}
 el('h3',m.name,p);const meta=el('dl',null,p,'model-detail-grid');
 [['Family',familyName(m.family_id)],['Size',param(m)],['License',m.license||'Unknown'],['Release',m.release_date?`${m.release_date}${m.release_status?.includes('unverified')?' · unverified':''}`:'Not verified']].forEach(([label,value])=>{const item=el('div',null,meta);el('dt',label,item);el('dd',value,item);});
 if(state.stage===2){const mid=$('evolution-metric').value,r=available(data,m.id,mid).find(r=>r.comparability_group===$('evolution-protocol').value);el('p',r?`${metrics.get(mid)?.label}: ${r.score} ${r.unit} · ${settingName(r)}`:'No score in the selected evaluation source.',p,'chart-note');}
 el('h4','Sources',p);sources(p,[m.release_evidence_url,...m.source_urls]);
 const relations=data.relationships.filter(r=>[r.source_model_id,r.target_model_id].includes(m.id));if(relations.length){el('h4','Recorded model links',p);const list=el('ul',null,p);relations.forEach(r=>{const n=el('li',`${models.get(r.source_model_id)?.name||r.source_model_id} → ${models.get(r.target_model_id)?.name||r.target_model_id} · ${r.relationship_type.replaceAll('_',' ')}. `,list);link(r.source_url,'Evidence ↗',n);});}
}

// 04 — comparable profiles; keep the radar prominent and the audit on demand.
function radarAxes(){return $('radar-mode').value==='benchmarks'?data.metrics.map(m=>({id:m.id,label:m.label,benchmark_id:m.id})):data.radar_concerns.map(id=>data.concerns.find(c=>c.id===id)).filter(c=>c.benchmark_id);}
function comparisonMetrics(){return radarAxes().map(c=>c.benchmark_id);}
const MIN_SHARED=4;
function syncPairControls(){
 const mids=comparisonMetrics();
 const choices=data.models.filter(m=>bestComparisonPartner(data,m.id,mids,MIN_SHARED)).sort((a,b)=>a.name.localeCompare(b.name));
 opts('model-a',choices.map(m=>[m.id,m.name]),state.a);
 opts('model-b',comparisonChoices(data,state.a,mids,MIN_SHARED).map(m=>[m.id,m.name]),state.b);
}
function announce(message){$('pair-status').textContent=message;let toast=$('selection-toast');if(!toast){toast=el('div',null,document.body,'inline-status');toast.id='selection-toast';toast.setAttribute('role','status');}toast.textContent=message;toast.hidden=false;clearTimeout(announce.timeout);announce.timeout=setTimeout(()=>{toast.hidden=true;},6500);}
function assignModel(slot,id){
 const mids=comparisonMetrics(),other=slot==='a'?'b':'a',partner=bestComparisonPartner(data,id,mids,MIN_SHARED);
 if(!partner){announce(models.get(id).name+' has too little shared benchmark evidence for this radar. Explore it in Families.');return;}
 state[slot]=id;let message=models.get(id).name+' selected as model '+slot.toUpperCase()+'.';
 if(id===state[other]||sharedCoverage(data,id,state[other],mids)<MIN_SHARED){state[other]=partner.id;message+=' '+models.get(partner.id).name+' selected as '+other.toUpperCase()+' to keep a measured comparison.';}
 state.groups={};syncPairControls();renderRadar();announce(message);
}
function renderRadar(){
 const a=models.get(state.a),b=models.get(state.b);if(!a||!b)return;
 syncPairControls();
 const axes=radarAxes(),pairs=axes.map(c=>pairScores(data,state.a,state.b,c.benchmark_id,state.groups[c.benchmark_id]));
 const vals=[pairs.map((p,i)=>normalized(p.a,metrics.get(axes[i].benchmark_id))),pairs.map((p,i)=>normalized(p.b,metrics.get(axes[i].benchmark_id)))];
 const meta=clear($('model-meta'));[a,b].forEach((m,i)=>{const n=el('div',null,meta);el('h3',(i?'B · ':'A · ')+m.name,n);el('p',param(m)+' · '+(m.license||'license unknown'),n);});
 const shared=pairs.filter(p=>p.a&&p.b).length;
 $('radar-coverage').textContent=shared+' of '+axes.length+' dimensions comparable';
 $('radar-task-reading').textContent='Published capabilities on shared-source, fixed scales.';
 const differences=clear($('radar-differences'));
 const deltas=axes.map((c,i)=>({c,p:pairs[i],delta:vals[0][i]===null||vals[1][i]===null?null:(vals[0][i]-vals[1][i])*100})).filter(d=>d.delta!==null).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
 deltas.slice(0,3).forEach(d=>{const r=el('div',null,differences,'difference-row');el('span',d.c.label,r);el('strong',d.delta===0?'Equal':(d.delta>0?'A +':'B +')+Math.abs(d.delta).toFixed(1),r);});
 if(deltas.length)el('p','Largest gaps · points on the fixed 0–100 scale',differences,'chart-note');
 const rationale=clear($('radar-rationale'));axes.forEach(c=>{const r=el('div',null,rationale,'rationale-row');el('span',c.label,r);el('span',c.rationale?fmt(concernCount(data,c.id,{}))+' mentions → '+metrics.get(c.benchmark_id).label:metrics.get(c.benchmark_id).range_min+'–'+metrics.get(c.benchmark_id).range_max+' published range',r);});
 const compact=innerWidth<650,w=compact?460:780,h=compact?470:570,s=svg('radar-chart',w,h),cx=w/2,cy=compact?230:285,R=compact?125:198,n=axes.length;
 const pos=(i,v)=>[cx+Math.cos(i/n*2*Math.PI-Math.PI/2)*R*v,cy+Math.sin(i/n*2*Math.PI-Math.PI/2)*R*v];
 [1,.75,.5,.25].forEach(t=>{s.append('polygon').attr('points',axes.map((c,i)=>pos(i,t).join(',')).join(' ')).attr('fill',t===1?'#fffaf5':'none').attr('stroke','#ddcfc8');text(s,cx+5,cy-R*t+13,t*100).style('font-size','10px');});
 axes.forEach((c,i)=>{const p=pos(i,1),l=pos(i,1.22);s.append('line').attr('x1',cx).attr('y1',cy).attr('x2',p[0]).attr('y2',p[1]).attr('stroke','#e5d9d2');const lab=text(s,l[0],l[1],c.label).attr('text-anchor',Math.abs(l[0]-cx)<15?'middle':l[0]>cx?'start':'end').style('font-size','13px').style('font-weight',650).style('fill','#443b43');wrap(lab,compact?80:122);});
 vals.forEach((vs,j)=>{const col=j?'#008aa6':'#e44868';if(vs.every(v=>v!==null))s.append('polygon').attr('points',vs.map((v,i)=>pos(i,v).join(',')).join(' ')).attr('fill',col).attr('fill-opacity',.13);
 for(let i=0;i<n;i++){const k=(i+1)%n;if(vs[i]===null||vs[k]===null)continue;const p=pos(i,vs[i]),q=pos(k,vs[k]);s.append('line').attr('x1',p[0]).attr('y1',p[1]).attr('x2',q[0]).attr('y2',q[1]).attr('stroke',col).attr('stroke-width',3).attr('stroke-dasharray',j?'7 4':null);}
 vs.forEach((v,i)=>{const p=pos(i,v??(1.03+j*.07));if(v===null){text(s,p[0],p[1]+4,'×').attr('text-anchor','middle').style('font-size','17px').style('fill',col);return;}const row=j?pairs[i].b:pairs[i].a;const dot=s.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',4.5).attr('fill',col).attr('stroke','#fffaf5').attr('stroke-width',1.5);dot.append('title').text((j?b.name:a.name)+' · '+axes[i].label+': '+row.score+' '+row.unit);});});
 const body=clear($('raw-scores').querySelector('tbody'));axes.forEach((c,i)=>{const tr=el('tr',null,body),m=metrics.get(c.benchmark_id),p=pairs[i],label=el('td',c.label,tr);el('small',m.label+' · '+m.range_min+'–'+m.range_max+' '+m.unit,label);
 const control=el('td',null,tr),groups=protocolGroups(data,m.id,[a.id,b.id]).filter(g=>p.shared.includes(g.id));
 if(groups.length){const select=el('select',null,control);select.setAttribute('aria-label',m.label+' comparison protocol');groups.forEach(g=>{const o=el('option',settingName(g.row),select);o.value=g.id;});select.value=p.group;select.onchange=()=>{state.groups[m.id]=select.value;renderRadar();};}else el('span','No shared source',control);
 [p.a,p.b].forEach(r=>{const td=el('td',r?r.score+' '+(r.unit||''):'Unavailable',tr);if(r)el('small',r.comparability_status,td);});sources(el('td',null,tr),[...(p.a?.source_urls||[]),...(p.b?.source_urls||[])]);});
}

// 05 — source-consistent ranking within explicit parameter-size tiers.
const taskSizeTiers=[
 {id:'compact',label:'Up to 4B',max:4},
 {id:'small',label:'Over 4–10B',max:10},
 {id:'medium',label:'Over 10–40B',max:40},
 {id:'large',label:'Over 40B',max:Infinity}
];
function sizeTier(parameters){return Number.isFinite(parameters)&&parameters>0?taskSizeTiers.find(t=>parameters<=t.max)?.id:null;}
function taskSourceGroups(mid,modelRows){
 const ids=modelRows.map(m=>m.id),known=new Set(modelRows.filter(m=>sizeTier(m.parameters_total_b)).map(m=>m.id));
 return protocolGroups(data,mid,ids).map(g=>({...g,sizedCount:[...g.models].filter(id=>known.has(id)).length}))
 .filter(g=>g.sizedCount>0).sort((a,b)=>b.sizedCount-a.sizedCount||b.models.size-a.models.size||a.id.localeCompare(b.id));
}
// Global evidence eligibility is independent of temporary interface filters.
// Unsupported task labels remain in the underlying feedback dataset.
function supportedTask(id){
 const task=tasks.get(id),corpus=data.models.filter(m=>m.open_weight===true);
 return !!task?.benchmark_ids.some(mid=>taskSourceGroups(mid,corpus).some(g=>g.sizedCount>=2));
}
function rankedTaskTiers(rows,limit=3){
 const valid=rows.filter(d=>sizeTier(d.model.parameters_total_b)&&Number.isFinite(d.row?.score));
 return taskSizeTiers.map(t=>{
  const ranked=valid.filter(d=>sizeTier(d.model.parameters_total_b)===t.id)
   .sort((a,b)=>b.row.score-a.row.score||a.model.parameters_total_b-b.model.parameters_total_b||a.model.name.localeCompare(b.model.name));
  return {...t,total:ranked.length,rows:ranked.slice(0,limit).map(d=>({...d,rank:1+ranked.filter(other=>other.row.score>d.row.score).length,leading:d.row.score===ranked[0]?.row.score}))};
 });
}
function prepareTaskMeasure(){
 const supported=data.tasks.filter(t=>supportedTask(t.id));
 if(!supportedTask(state.task)&&supported.length){state.task=supported[0].id;state.candidateFocus=null;}
 const task=tasks.get(state.task),corpus=data.models.filter(m=>m.open_weight===true);
 const ids=(task?.benchmark_ids||[]).filter(mid=>taskSourceGroups(mid,corpus).some(g=>g.sizedCount>=2));
 opts('task-metric',ids.length?ids.map(id=>[id,metrics.get(id)?.label||id]):[['','No supported benchmark']],$('task-metric').value);
 prepareTaskProtocol();
}
function candidates(){return data.models.filter(m=>eligible(m,{family:state.family,license:$('license-filter').value,max:$('params-filter').value}));}
function prepareTaskProtocol(){
 const groups=taskSourceGroups($('task-metric').value,candidates()),current=groups.find(g=>g.id===$('task-protocol').value);
 const selected=current&&(current.sizedCount>=2||groups[0]?.sizedCount<2)?current.id:groups[0]?.id;
 opts('task-protocol',groups.length?groups.map(g=>[g.id,g.sizedCount+' scored models with known size · '+settingName(g.row)]):[['','No measured candidates']],selected);
}
function candidateScore(model){return available(data,model.id,$('task-metric').value).find(r=>r.comparability_group===$('task-protocol').value)||null;}
function inspectTaskCandidate(id,trigger){state.candidateFocus=id;renderCandidate();openModal('dialog-candidate',trigger);}
function renderMapping(){
 const task=tasks.get(state.task),pills=clear($('task-pills'));
 data.tasks.filter(t=>supportedTask(t.id)).forEach(t=>{const b=el('button',t.label,pills);b.setAttribute('aria-pressed',String(t.id===state.task));b.onclick=()=>setTask(t.id);});
 const all=candidates(),metric=metrics.get($('task-metric').value);
 const measured=all.map(model=>({model,row:candidateScore(model)})).filter(d=>d.row);
 const sized=measured.filter(d=>sizeTier(d.model.parameters_total_b)),tiers=rankedTaskTiers(sized);
 const source=sized[0]?.row,sourceLabel=source?.source_type==='openvlm_baseline'?'OpenVLM source table':'Official model-card source table';
 $('matrix-note').textContent=sized.length+' measured models'+(metric?' · '+metric.label:'')+(source?' · '+sourceLabel:'');
 $('task-mapping-method').textContent=(task?.mapping_rationale||'No direct task benchmark is available.')+' Rankings use one selected source group, separately within each size tier and your metadata filters. They describe a benchmark result, not overall model quality or hardware requirements. Tied scores share a rank; only three rows per tier are shown.';
 if(!all.some(m=>m.id===state.candidateFocus))state.candidateFocus=tiers.flatMap(t=>t.rows)[0]?.model.id||all[0]?.id||null;
 const sort=$('candidate-sort').value,rows=[...all].sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='size'?(a.parameters_total_b??Infinity)-(b.parameters_total_b??Infinity)||a.name.localeCompare(b.name):(candidateScore(b)?.score??-Infinity)-(candidateScore(a)?.score??-Infinity)||a.name.localeCompare(b.name));
 const list=clear($('candidate-list'));
 rows.forEach(model=>{const r=candidateScore(model),b=el('button',null,list,'candidate-row');const title=el('span',model.name,b);el('small',param(model),title);el('strong',r?String(r.score):'No score',b);b.setAttribute('aria-label',model.name+', '+(r?'score '+r.score:'no score in this source')+'. Inspect evidence.');b.onclick=e=>inspectTaskCandidate(model.id,e.currentTarget);});
 const board=clear($('task-mapping'));board.classList.add('task-tier-board');
 if(!sized.length){
  el('p',!all.length?'No models meet these filters. Try another license or size limit.':'No measured models with known sizes in this source. Reset the filters to restore measured candidates.',board,'empty');
  const reset=el('button','Reset filters',board,'button primary');reset.onclick=()=>{$('params-filter').value='all';$('license-filter').value='all';state.candidateFocus=null;prepareTaskProtocol();renderMapping();};
  $('mapping-insight').textContent=measured.length?measured.length+' scored models have unknown sizes; see all candidates.':'All eligible candidates and evidence gaps remain available below.';renderCandidate();return;
 }
 const scale=el('div',null,board,'tier-scale');el('span',metric.label+' · '+metric.range_min+'–'+metric.range_max+' '+metric.unit,scale);el('span','Up to 3 leading models per size tier',scale);
 const grid=el('div',null,board,'tier-grid');
 tiers.forEach(t=>{
  const section=el('section',null,grid,'size-tier'+(!t.total?' size-tier-empty':'')),head=el('div',null,section,'tier-heading');
  el('h3',t.label,head);el('span',t.total+' measured',head);
  if(!t.total){el('p','No measured candidates in this tier.',section,'tier-empty');return;}
  const tierList=el('div',null,section,'tier-rows');
  t.rows.forEach(({model,row,rank,leading})=>{
   const b=el('button',null,tierList,'task-ranked-row'+(leading?' tier-leading':''));b.dataset.modelId=model.id;b.dataset.score=String(row.score);b.dataset.tier=t.id;
   b.setAttribute('aria-label',model.name+', rank '+rank+' within '+t.label+' parameters. '+metric.label+' '+row.score+' '+metric.unit+'. Open evidence.');
   const line=el('div',null,b,'tier-row-top');el('span',String(rank).padStart(2,'0'),line,'tier-rank');el('strong',model.name,line,'tier-model-name');el('strong',String(row.score),line,'tier-score');
   const meta=el('div',null,b,'tier-row-meta');el('span',param(model)+' · '+familyName(model.family_id),meta);if(leading)el('span','Highest score',meta,'tier-leader-label');
   const bar=d3.select(b).append('svg').attr('viewBox','0 0 100 8').attr('preserveAspectRatio','none').attr('class','tier-score-bar').attr('aria-hidden','true');
   const width=Math.max(0,Math.min(100,(row.score-metric.range_min)/(metric.range_max-metric.range_min)*100));
   bar.append('rect').attr('x',0).attr('y',2).attr('width',100).attr('height',4).attr('rx',2).attr('fill','#ece5e0');
   bar.append('rect').attr('x',0).attr('y',2).attr('width',width).attr('height',4).attr('rx',2).attr('fill',leading?'#e44868':'#008fa8');
   b.onclick=e=>inspectTaskCandidate(model.id,e.currentTarget);
  });
  if(t.total>3){const more=el('button','See all candidates ↗',section,'tier-more');more.onclick=e=>openModal('dialog-all-candidates',e.currentTarget);}
 });
 $('mapping-insight').textContent='Highest score means best on this benchmark within the selected source and size tier. Select a model to inspect its evidence.';
 renderCandidate();
}
function renderCandidate(){
 const model=models.get(state.candidateFocus),task=tasks.get(state.task),panel=clear($('candidate-evidence'));
 if(!model||!task){el('p','Choose a model to inspect its evidence.',panel);return;}
 el('h3',model.name,panel);el('p',param(model)+' · '+(model.license||'license unknown'),panel);
 const row=candidateScore(model),score=el('strong',row?String(row.score):'No score',panel,'candidate-score');
 el('small',row?metrics.get(row.benchmark_id).label+' · '+row.unit:'No measurement in this source',score);
 if(row){el('p',settingName(row)+' · '+String(row.comparability_status||'settings incomplete').replaceAll('_',' '),panel,'chart-note');sources(panel,row.source_urls);}else sources(panel,model.source_urls);
 const exact=feedbackRows(task.id,'model',model.id),family=feedbackRows(task.id,'family',model.family_id);
 const exactSection=el('section',null,panel,'candidate-context');el('h4','Task discussion · '+fmt(total(exact))+' exact-model records',exactSection);
 if(total(exact)){el('p',fmt(total(exact,'actual_experience_count'))+' rule-identified uses/problems; attribution is unvalidated.',exactSection);showExcerpts(exactSection,exact,data.excerpt_lookup,1);}else el('p','No exact-model task feedback is attributed in this sample.',exactSection);
 if(total(family)){const familySection=el('section',null,panel,'candidate-context');el('h4',fmt(total(family))+' family-level task mentions',familySection);el('p','Family context, not a rating of this variant.',familySection);showExcerpts(familySection,family,data.excerpt_lookup,1);}
 const practical=el('section',null,panel,'candidate-context');el('h4','Checks before deploying',practical);el('p','Verify licensing and test failure cases, speed and memory on your task. Parameter size does not guarantee GPU memory requirements.',practical);
}
function findings(){const box=clear($('findings-grid'));const quant=total(data.growth.repository_creation.filter(r=>r.repo_type==='quantization'));const entries=[[(100*quant/data.counts.repositories).toFixed(1)+'%','Derivatives shape the ecosystem',`${fmt(quant)} repositories are classified as quantizations. Repository growth should not be equated with new architectures.`],[(100*data.counts.task_labeled_feedback/data.counts.feedback).toFixed(1)+'%','Task evidence is sparse',`${fmt(data.counts.task_labeled_feedback)} of ${fmt(data.counts.feedback)} records received task labels. The rest cannot be silently assigned a task.`],[fmt(data.counts.exact_model_feedback),'Exact-model records',`Only ${(100*data.counts.exact_model_feedback/data.counts.feedback).toFixed(1)}% of records map to a canonical model. Most practical discussion remains family-level.`]];for(const [n,title,body]of entries){const a=el('article',null,box);el('strong',n,a);el('h3',title,a);el('p',body,a);}}
function stopStory(){if(timer)clearInterval(timer);timer=null;$('story-play').textContent='Play story';}
function wire(){
 wireDialogs();
 document.addEventListener('story:pagechange',e=>{hideTip();if(e.detail?.id!=='evolution')stopStory();});
 let compactLayout=innerWidth<650;window.addEventListener('resize',()=>{const next=innerWidth<650;if(next!==compactLayout){compactLayout=next;renderCloud();renderRadar();}});
 $('platform-filter').onchange=e=>{state.platform=e.target.value;renderCloud();};
 $('experience-filter').onchange=e=>{state.experience=e.target.value;renderCloud();};
 for(const id of ['growth-mode','growth-group'])$(id).onchange=()=>{state.growthFocus=null;renderGrowth();};
 $('growth-unfocus').onclick=()=>{state.growthFocus=null;renderGrowth();};
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stopStory();state.stage=+b.dataset.stage;renderEvolution();});
 $('story-play').onclick=()=>{if(timer){stopStory();return;}state.stage=0;renderEvolution();$('story-play').textContent='Pause story';timer=setInterval(()=>{state.stage++;renderEvolution();if(state.stage===2)stopStory();},3500);};
 $('reduce-motion').onchange=()=>{stopStory();renderEvolution();};document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStory();});
 $('model-search').oninput=renderEvolution;
 $('evolution-metric').onchange=()=>{prepareEvolutionProtocol();renderEvolution();};
 $('evolution-protocol').onchange=renderEvolution;
 ['a','b'].forEach(slot=>$('model-'+slot).onchange=e=>assignModel(slot,e.target.value));
 $('radar-mode').onchange=()=>{if(sharedCoverage(data,state.a,state.b,comparisonMetrics())<MIN_SHARED)assignModel('a',state.a);else renderRadar();};
 for(const id of ['license-filter','params-filter'])$(id).onchange=()=>{state.candidateFocus=null;prepareTaskProtocol();renderMapping();};
 $('task-metric').onchange=()=>{state.candidateFocus=null;prepareTaskProtocol();renderMapping();};
 $('task-protocol').onchange=()=>{state.candidateFocus=null;renderMapping();};
 $('candidate-sort').onchange=renderMapping;
}
async function init(){try{
 if(typeof d3==='undefined')throw new Error('The bundled D3 library did not load.');
 const response=await fetch('data/final/explorer_data.json');if(!response.ok)throw new Error('Data request failed ('+response.status+')');
 data=await response.json();models=new Map(data.models.map(m=>[m.id,m]));tasks=new Map(data.tasks.map(t=>[t.id,t]));metrics=new Map(data.metrics.map(m=>[m.id,m]));
 const canonicalFamilies=[...new Set(data.models.map(m=>m.family_id))].sort(),other=data.families.map(f=>f.id).filter(f=>!canonicalFamilies.includes(f));
 color=d3.scaleOrdinal().domain([...canonicalFamilies,...other]).range([...palette,...other.map((f,i)=>d3.hsl((i*137.5+20)%360,.42,.48).formatHex())]);
 const defaultPair=data.radar_defaults.pair;state.a=defaultPair[0];state.b=defaultPair[1];state.focus=null;state.groups={...data.radar_defaults.groups};
 opts('license-filter',[['all','All / unknown included'],...[...new Set(data.models.map(m=>m.license||'unknown'))].sort().map(l=>[l,l])],'all');
 const choices=data.models.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(m=>[m.id,m.name]);
 opts('model-a',choices,state.a);opts('model-b',choices,state.b);
 opts('evolution-metric',data.metrics.map(m=>[m.id,m.label]),'mmmu');
 $('reduce-motion').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const stats=clear($('summary'));
 [[data.counts.repositories,'unique retained model repositories'],[data.counts.feedback,'distinct community records'],[data.models.length,'canonical comparison models'],[data.tasks.length,'rule-supported task categories']].forEach(([n,t])=>{const p=el('div',null,stats);el('strong',fmt(n),p);el('span',t,p);});
 $('load-status').textContent='';$('load-status').hidden=true;
 wire();prepareTaskMeasure();refresh();findings();document.body.dataset.ready='true';
 document.dispatchEvent(new CustomEvent('story:ready'));
 }catch(error){$('load-status').hidden=false;$('load-status').textContent='Unable to load the atlas: '+error.message+'. Reload the page or open the saved scrolling version.';$('load-status').className='error';console.error(error);}
}
init();
