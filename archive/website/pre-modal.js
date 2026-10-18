import {normalized, available, protocolGroups, pairScores, eligible, matchFeedback, concernCount, sharedCoverage, comparisonChoices, bestComparisonPartner, paretoFrontier} from './pre-modal-core.mjs';

const $=id=>document.getElementById(id), fmt=n=>Number(n||0).toLocaleString('en-US');
const state={family:'all',platform:'all',experience:'all',cloud:'all',concern:'documents',task:'document-understanding',stage:0,focus:null,candidateFocus:null,a:null,b:null,page:0,groups:{},growthFocus:null};
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
const duration=()=> $('reduce-motion').checked?0:750;
const familyName=id=>data.families.find(f=>f.id===id)?.label||id;
const param=m=>m.parameters_total_b==null?'size unknown':`${Number(m.parameters_total_b).toLocaleString('en-US',{maximumFractionDigits:2})}B parameters`;
const total=(rows,key='count')=>d3.sum(rows,r=>r[key]||0);
const feedbackRows=(task,scope='all',entity='')=>data.feedback_buckets.filter(r=>r.task_id===task&&r.scope===scope&&r.entity_id===entity&&matchFeedback(r,state));
function settingName(row){if(!row)return 'No measurement';if(row.source_type==='openvlm_baseline')return `OpenVLM · ${row.split||'unknown split'} · settings incomplete`;let src='Official card';try{src=new URL(row.source_urls[0]).pathname.split('/').pop();}catch{}return `${src} · ${row.split||'split unknown'}`;}
function sources(parent,urls){const n=el('div',null,parent,'evidence-links');[...new Set(urls.filter(Boolean))].slice(0,4).forEach((u,i)=>link(u,`Source ${i+1} ↗`,n));}
function showExcerpts(parent,buckets,lookup=data.excerpt_lookup,limit=2){const keys=[...new Set(buckets.flatMap(b=>b.excerpt_ids||[]))];const rows=keys.map(id=>lookup[id]).filter(r=>r?.text?.length>20).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))).slice(0,limit);if(!rows.length){el('p','No excerpt is available in the capped public sample for these filters; counts still use the complete cleaned corpus.',parent,'chart-note');return;}const box=el('div',null,parent,'excerpts');for(const r of rows){const n=el('article',null,box,'excerpt');el('small',`${r.platform} · ${String(r.published_at).slice(0,10)} · ${r.attribution_level} association`,n);el('blockquote',r.text+'…',n);el('small',`${String(r.experience_type||'discussion').replaceAll('_',' ')} · rule-generated label · shortened excerpt`,n);link(r.source_url,'Read full context ↗',n);}}
function actions(parent,id){const n=el('div',null,parent,'evidence-actions'),supported=!!bestComparisonPartner(data,id,comparisonMetrics(),MIN_SHARED);for(const slot of ['a','b']){const chosen=state[slot]===id,b=el('button',chosen?`Selected as ${slot.toUpperCase()} ✓`:`Choose as ${slot.toUpperCase()}`,n,'button');b.setAttribute('aria-pressed',String(chosen));b.disabled=!supported;b.onclick=()=>assignModel(slot,id);}if(!supported)el('p','Too little shared benchmark evidence for a radar comparison.',n,'action-status');else if([state.a,state.b].includes(id)){const a=el('a','View comparison ↑',n,'text-link');a.href='#radar';}}
function setTask(id){state.task=id;state.candidateFocus=null;state.page=0;const c=data.concerns.find(c=>c.task_id===id);if(c)state.concern=c.id;$('selected-task-label').textContent=tasks.get(id)?.label||id;prepareTaskMeasure();renderCloud();renderMapping();renderRadar();}
function selectModel(id){state.focus=id;renderEvolution();}
function refresh(){state.page=0;renderGrowth();renderCloud();prepareEvolutionProtocol();renderEvolution();prepareTaskProtocol();renderMapping();renderRadar();}

// 01 — category reordering moves the selected area to a shared zero baseline.
function renderGrowth(){
 const mode=$('growth-mode').value;let group=$('growth-group').value;
 $('growth-group').disabled=mode==='verified_release';if(mode==='verified_release')group='family';
 const all=data.growth[mode].filter(r=>(state.family==='all'||r.family_id===state.family)&&r.month!=='unknown'&&r.count>0);
 if(!all.length){$('growth-total').textContent='No dated records';empty('growth-chart','No dated records for this family. Choose another family.');clear($('growth-legend'));$('growth-insight').textContent='';return;}
 const [first,last]=d3.extent(all,r=>r.month),seriesKey=`${mode}:${state.family}`,changed=$('growth-chart').dataset.series!==seriesKey;$('growth-chart').dataset.series=seriesKey;
 let from=changed?first:$('date-from').value||first,to=changed?last:$('date-to').value||last;if(from>to)[from,to]=[to,from];from=from<first?first:from>last?last:from;to=to<first?first:to>last?last:to;$('date-from').value=from;$('date-to').value=to;
 const through=all.filter(r=>r.month<=to),n=total(through);
 $('growth-total').textContent=`${fmt(n)} ${mode==='verified_release'?'verified model releases':'model repositories'} through ${to}`;
 const sums=d3.rollups(all,v=>total(v),r=>group==='type'?r.repo_type:r.family_id).sort((a,b)=>b[1]-a[1]);const top=sums.slice(0,7).map(([k])=>k);
 const key=r=>group==='type'?r.repo_type:(top.includes(r.family_id)?r.family_id:'Other families');
 const keys=[...new Set(all.map(key))].sort((a,b)=>total(all.filter(r=>key(r)===b))-total(all.filter(r=>key(r)===a)));
 if(state.growthFocus&&!keys.includes(state.growthFocus))state.growthFocus=null;
 if(state.growthFocus)keys.sort((a,b)=>(a===state.growthFocus?-1:b===state.growthFocus?1:0));
 const name=k=>group==='type'?(typeNames[k]||k):familyName(k),fill=k=>group==='type'?typeColors[k]:k==='Other families'?'#aab5c7':color(k);
 const legend=clear($('growth-legend'));keys.forEach(k=>{const b=el('button',null,legend);b.setAttribute('aria-pressed',String(k===state.growthFocus));const i=el('i',null,b);i.style.background=fill(k);el('span',`${name(k)} · ${fmt(total(through.filter(r=>key(r)===k)))}`,b);b.onclick=()=>{state.growthFocus=state.growthFocus===k?null:k;renderGrowth();};});$('growth-unfocus').hidden=!state.growthFocus&&from===first&&to===last;
 const parse=d3.utcParse('%Y-%m'),format=d3.utcFormat('%Y-%m');const months=d3.utcMonth.range(parse(from),d3.utcMonth.offset(parse(to),1));
 // A brush changes the visible window, never the cumulative baseline.
 const running=Object.fromEntries(keys.map(k=>[k,total(all.filter(r=>r.month<from&&key(r)===k))]));const inc=d3.rollup(all,v=>total(v),r=>r.month,key);
 const points=months.map(date=>{const month=format(date),p={date,month,total:0};for(const k of keys){running[k]+=inc.get(month)?.get(k)||0;p[k]=running[k];p.total+=p[k];}return p;});
 if(points.length===1)points.push({...points[0],date:d3.utcMonth.offset(points[0].date,1)});
 const w=1140,h=450,m={l:65,r:24,t:25,b:100};let s=d3.select('#growth-chart svg');if(s.empty())s=svg('growth-chart',w,h);
 s.attr('data-first-month',first).attr('data-last-month',last).attr('data-visible-from',from).attr('data-visible-to',to).attr('data-total',n);
 const x=d3.scaleUtc().domain(d3.extent(points,p=>p.date)).range([m.l,w-m.r]);const y=d3.scaleLinear().domain([0,d3.max(points,p=>p.total)||1]).nice().range([h-m.b,m.t]);
 s.selectAll('.axis,.grid,.overview,.label').remove();s.append('g').attr('class','grid').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(w-m.l-m.r)).tickFormat('')).call(g=>g.select('.domain').remove());
 const series=d3.stack().keys(keys)(points),area=d3.area().x(d=>x(d.data.date)).y0(d=>y(d[0])).y1(d=>y(d[1])).curve(d3.curveMonotoneX);
 const paths=s.selectAll('path.area').data(series,d=>d.key).join('path').attr('class','area').attr('fill',d=>fill(d.key)).attr('fill-opacity',.9).attr('stroke',d=>fill(d.key)).attr('stroke-width',1.1);
 paths.interrupt().transition().duration(duration()).attr('d',area);paths.on('pointermove',(e,d)=>{const date=format(d3.utcMonth.round(x.invert(d3.pointer(e,s.node())[0]))),p=points.find(p=>p.month===date)||points.at(-1);tip(e,`${name(d.key)} · through ${p.month}\n${fmt(p[d.key])} cumulative records\nClick to compare from the baseline`);}).on('pointerleave',hideTip).on('click',(e,d)=>{state.growthFocus=d.key;hideTip();renderGrowth();});
 const ticks=from===to?[parse(from)]:[parse(from),...x.ticks(5).filter(d=>x(d)>m.l+95&&x(d)<w-m.r-95),parse(to)];
 s.append('g').attr('class','axis').attr('transform',`translate(0,${h-m.b})`).call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.utcFormat('%b %Y'))).selectAll('.tick text').attr('text-anchor',d=>+d===+parse(from)?'start':+d===+parse(to)?'end':'middle');s.append('g').attr('class','axis').attr('transform',`translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')));
 text(s,m.l,15,'Cumulative count','label');
 const fullMonths=d3.utcMonth.range(parse(first),d3.utcMonth.offset(parse(last),1));let accumulated=0;const monthly=fullMonths.map(date=>{accumulated+=total(all.filter(r=>r.month===format(date)));return {date,count:accumulated};});
 if(monthly.length===1)monthly.push({...monthly[0],date:d3.utcMonth.offset(monthly[0].date,1)});
 const ox=d3.scaleUtc().domain(d3.extent(monthly,p=>p.date)).range([m.l,w-m.r]),oy=d3.scaleLinear().domain([0,accumulated||1]).range([h-25,h-65]);
 const overview=s.append('g').attr('class','overview');overview.append('path').attr('d',d3.area().x(d=>ox(d.date)).y0(h-25).y1(d=>oy(d.count)).curve(d3.curveMonotoneX)(monthly)).attr('fill','#f2a4b4');
 const brush=d3.brushX().extent([[m.l,h-70],[w-m.r,h-22]]).on('end',e=>{if(!e.sourceEvent)return;if(!e.selection){$('date-from').value=first;$('date-to').value=last;}else{const dates=e.selection.map(ox.invert).map(d=>format(d3.utcMonth.round(d)));$('date-from').value=dates[0];$('date-to').value=dates[1];}renderGrowth();});const selection=from===to?[Math.max(m.l,ox(parse(from))-4),Math.min(w-m.r,ox(parse(to))+4)]:[ox(parse(from)),ox(parse(to))];overview.append('g').call(brush).call(brush.move,selection);
 const q=total(through.filter(r=>r.repo_type==='quantization'));
 $('growth-insight').textContent=mode==='repository_creation'?`${n?(100*q/n).toFixed(1):0}% are quantizations. Repository growth includes adaptations of existing models.`:`${fmt(n)} verified releases in the curated comparison set.`;
}

// 02 — custom collision-tested phrase packing, with an exact ranked companion.
function renderCloud(){
 const ranked=data.concerns.map(c=>({...c,count:concernCount(data,c.id,state)})).sort((a,b)=>b.count-a.count);
 const denominator=total(data.feedback_totals.filter(r=>matchFeedback(r,state)));$('task-denominator').textContent=`${fmt(denominator)} source records in this selection. Each phrase counts distinct matching records; a record can mention several concerns. “Reported use or problems” includes rule-inferred observations and problem reports. Labels are not human-validated; these support forums do not represent all users.`;
 const list=clear($('task-ranked'));ranked.forEach(c=>{const b=el('button',null,list,'rank-row');b.setAttribute('aria-pressed',String(c.id===state.concern));b.style.setProperty('--bar',`${100*c.count/(ranked[0]?.count||1)}%`);el('span',c.label,b);el('strong',fmt(c.count),b);b.onclick=()=>selectConcern(c.id);});
 const mobile=innerWidth<650,w=mobile?420:1100,h=mobile?520:430,s=svg('task-cloud',w,h);const scale=d3.scalePow().exponent(.85).domain([0,ranked[0]?.count||1]).range([15,mobile?48:78]);const placed=[];
 ranked.filter(c=>c.count>0).forEach((c,index)=>{
  const node=text(s,0,0,c.label).attr('text-anchor','middle').attr('data-concern',c.id).style('font-weight',c.id===state.concern?750:650).style('fill',c.kind==='practical'?'#df396d':'#008daa');let size=scale(c.count),location;
  for(let pass=0;pass<7&&!location;pass++){
   if(pass===6)size=15;
   node.style('font-size',`${size}px`);const box=node.node().getBBox(),bw=box.width+18,bh=box.height+14;
   for(let j=0;j<9000;j++){const angle=j*.39+index*.5,r=(mobile?4.4:6.4)*Math.sqrt(j),x=w/2+Math.cos(angle)*r,y=h/2+Math.sin(angle)*r*(mobile?.9:.44);const b={x:x+box.x-9,y:y+box.y-7,w:bw,h:bh};if(b.x<8||b.x+bw>w-8||b.y<10||b.y+bh>h-10)continue;if(placed.some(p=>b.x<p.x+p.w&&b.x+b.w>p.x&&b.y<p.y+p.h&&b.y+b.h>p.y))continue;location={x,y,b};break;}size=Math.max(15,size*.88);
  }
  if(!location){node.remove();return;}placed.push(location.b);node.attr('x',location.x).attr('y',location.y).attr('text-decoration',c.id===state.concern?'underline':null);active(node,()=>selectConcern(c.id),`${c.label}, ${fmt(c.count)} records. Inspect concern.`);node.on('pointermove',e=>tip(e,`${c.label}\n${fmt(c.count)} distinct records\nClick for source context`)).on('pointerleave',hideTip);
 });
 if(!ranked.some(c=>c.count))text(s,w/2,h/2,'No matching concern labels in this selection.').attr('text-anchor','middle');
 const c=data.concerns.find(c=>c.id===state.concern),panel=clear($('task-evidence'));if(c){const head=el('div',null,panel,'evidence-top'),copy=el('div',null,head);el('h3',c.label,copy);el('p',`${fmt(concernCount(data,c.id,state))} matching records`,copy,'concern-count');if(c.task_id){const b=el('button','Find models →',head,'button primary');b.onclick=()=>{setTask(c.task_id);$('matrix').scrollIntoView({behavior:duration()?'smooth':'instant'});};}const details=el('details',null,panel);el('summary','Read examples & measurement context',details);el('p',c.rationale,details,'chart-note');const buckets=data.concern_buckets.filter(r=>r.concern_id===c.id&&r.scope==='all'&&matchFeedback(r,state));const samples=state.experience==='experience'?Object.fromEntries(Object.entries(data.concern_excerpts).filter(([,r])=>['usage_observation','problem_report'].includes(r.experience_type))):data.concern_excerpts;showExcerpts(details,buckets,samples);el('p','Examples are a small source-linked sample; counts use the full eligible corpus.',details,'chart-note');}
 $('task-insight').textContent='';
}
function selectConcern(id){hideTip();state.concern=id;const c=data.concerns.find(c=>c.id===id);if(c?.task_id){state.task=c.task_id;state.candidateFocus=null;state.page=0;$('selected-task-label').textContent=tasks.get(state.task)?.label;prepareTaskMeasure();renderMapping();renderRadar();}renderCloud();}

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
 const query=state.stage===2?$('model-search').value.trim().toLowerCase():'';$('evolution-metric').disabled=state.stage!==2;$('evolution-protocol').disabled=state.stage!==2;if($('evolution-performance-controls')){$('evolution-performance-controls').hidden=state.stage!==2;$('evolution-performance-controls').classList.toggle('hidden',state.stage!==2);}
 document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.stage===state.stage)));
 if(!rows.length){evolutionSvg=null;empty('evolution-chart','This family has repository records but no canonical comparison model. Choose another family or reset exploration.');clear($('evolution-legend'));$('evolution-narrative').textContent='No curated comparison models in this family.';renderModelEvidence();return;}
 if(state.stage===0){
  const dated=rows.filter(m=>m.release_date&&m.release_status?.includes('verified')&&!m.release_status.includes('unverified'));const dates=d3.extent(dated,m=>new Date(m.release_date));if(dated.length&&+dates[0]===+dates[1]){dates[0]=d3.utcMonth.offset(dates[0],-1);dates[1]=d3.utcMonth.offset(dates[1],1);}const x=d3.scaleUtc().domain(dated.length?dates:[new Date('2023-01-01'),new Date('2026-10-17')]).range([margin.l,w-margin.r]);const lanes=new Map();
  for(const m of [...dated].sort((a,b)=>a.release_date.localeCompare(b.release_date))){const px=x(new Date(m.release_date));let lane=0;while((lanes.get(lane)||[]).some(v=>Math.abs(v-px)<22))lane++;if(!lanes.has(lane))lanes.set(lane,[]);lanes.get(lane).push(px);positions.set(m.id,{x:px,y:210+(lane%2?-1:1)*Math.ceil(lane/2)*24,r:9});}
  const unknown=rows.filter(m=>!positions.has(m.id));unknown.forEach((m,i)=>positions.set(m.id,{x:65+i*28,y:422,r:9}));
  deco.append('g').attr('transform','translate(0,345)').call(d3.axisBottom(x).ticks(7).tickFormat(d3.utcFormat('%b %Y')));deco.selectAll('line.year').data(x.ticks(7)).join('line').attr('x1',x).attr('x2',x).attr('y1',55).attr('y2',345).attr('stroke','#dfd0c9').attr('stroke-dasharray','3 5');text(deco,65,32,'Verified release date','mark-label');if(unknown.length)text(deco,65,395,`${unknown.length} undated models`);
  $('evolution-narrative').textContent=`${dated.length} dated releases. Each dot is a model; select one to inspect or compare.`;
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
 const nodes=s.selectAll('circle.model-dot').data(rows,m=>m.id).join(enter=>enter.append('circle').attr('class','model-dot').attr('cx',w/2).attr('cy',h/2).attr('r',0),update=>update,exit=>exit.remove()).attr('fill',m=>color(m.family_id)).attr('stroke',m=>m.id===state.focus?'#322e35':[state.a,state.b].includes(m.id)?'#fff':'#fffaf5').attr('stroke-width',m=>m.id===state.focus?3:1.5).attr('opacity',m=>!query||m.name.toLowerCase().includes(query)?1:.16);
 nodes.interrupt().transition().duration(duration()).attr('cx',m=>positions.get(m.id)?.x??0).attr('cy',m=>positions.get(m.id)?.y??0).attr('r',m=>positions.get(m.id)?.r??8);
 active(nodes,(e,m)=>{hideTip();selectModel(m.id);},m=>`${m.name}. ${familyName(m.family_id)}. Inspect model.`);nodes.on('pointermove',(e,m)=>{const r=available(data,m.id,mid).find(r=>r.comparability_group===group);tip(e,`${m.name}\n${familyName(m.family_id)} · ${param(m)}\n${state.stage===2?`${metric?.label}: ${r?r.score:'unavailable in this group'}`:`Release: ${m.release_date||'unverified/unknown'}`}\nClick to inspect or shortlist`);}).on('pointerleave',hideTip);
 const labels=state.stage===1?[]:rows.filter(m=>m.id===state.focus||query&&m.name.toLowerCase().includes(query)).slice(0,6);const ls=s.selectAll('text.dot-label').data(labels,m=>m.id).join('text').attr('class','dot-label mark-label').style('pointer-events','none').style('font-size','10px').text(m=>m.name);ls.interrupt().transition().duration(duration()).attr('x',m=>positions.get(m.id).x).attr('y',m=>positions.get(m.id).y-positions.get(m.id).r-8).attr('text-anchor',m=>positions.get(m.id).x>w-200?'end':positions.get(m.id).x<200?'start':'middle');
 const pairLabels=s.selectAll('text.pair-label').data(rows.filter(m=>m.id===state.a||m.id===state.b),m=>m.id).join('text').attr('class','pair-label').attr('text-anchor','middle').style('pointer-events','none').style('fill','#fff').style('font-size',state.stage===1?'11px':'9px').style('font-weight',800).text(m=>m.id===state.a?'A':'B');pairLabels.interrupt().transition().duration(duration()).attr('x',m=>positions.get(m.id).x).attr('y',m=>positions.get(m.id).y+3);
 const legend=clear($('evolution-legend'));legend.hidden=state.stage!==0;families.forEach(f=>{const item=el('span',null,legend);el('i',null,item).style.background=color(f);el('span',`${familyName(f)} · ${rows.filter(m=>m.family_id===f).length}`,item);});renderModelEvidence();
}
function renderModelEvidence(){
 const m=models.get(state.focus||state.a),p=clear($('model-evidence'));if(!m||state.family!=='all'&&m.family_id!==state.family){el('p','Select a dot to inspect a model.',p);return;}
 const head=el('div',null,p,'evidence-top'),copy=el('div',null,head);el('h3',m.name,copy);el('p',`${familyName(m.family_id)} · ${param(m)} · ${m.license||'license unknown'}`,copy);actions(head,m.id);
 if(state.stage===2){const mid=$('evolution-metric').value,r=available(data,m.id,mid).find(r=>r.comparability_group===$('evolution-protocol').value);el('p',r?`${metrics.get(mid)?.label}: ${r.score} ${r.unit}`:'No score in this comparison source.',copy,'chart-note');}
 const d=el('details',null,p),relations=data.relationships.filter(r=>[r.source_model_id,r.target_model_id].includes(m.id));el('summary','Sources & model details',d);el('p',`Release: ${m.release_date||'unverified'}${m.release_status?.includes('unverified')?' · unverified':''}. Family groups indicate membership, not ancestry.`,d,'chart-note');sources(d,[m.release_evidence_url,...m.source_urls]);if(relations.length)relations.forEach(r=>{const n=el('p',`${models.get(r.source_model_id)?.name||r.source_model_id} → ${models.get(r.target_model_id)?.name||r.target_model_id} · ${r.relationship_type.replaceAll('_',' ')}. `,d);link(r.source_url,'Evidence ↗',n);});
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
 const mids=comparisonMetrics(),other=slot==='a'?'b':'a',validPartners=comparisonChoices(data,id,mids,MIN_SHARED),eligibleIds=new Set(candidates().map(m=>m.id)),partner=validPartners.find(m=>eligibleIds.has(m.id)&&candidateScore(m))||validPartners.find(m=>eligibleIds.has(m.id))||validPartners[0];
 if(!partner){announce(models.get(id).name+' has too little shared benchmark evidence for this radar. Explore it in Families.');return;}
 state[slot]=id;let message=models.get(id).name+' selected as model '+slot.toUpperCase()+'.';
 if(id===state[other]||sharedCoverage(data,id,state[other],mids)<MIN_SHARED){state[other]=partner.id;message+=' '+models.get(partner.id).name+' selected as '+other.toUpperCase()+' to keep a measured comparison.';}
 state.groups={};syncPairControls();renderRadar();renderEvolution();renderMapping();announce(message);
}
function renderRadar(){
 const a=models.get(state.a),b=models.get(state.b);if(!a||!b)return;
 syncPairControls();
 const axes=radarAxes(),pairs=axes.map(c=>pairScores(data,state.a,state.b,c.benchmark_id,state.groups[c.benchmark_id]));
 const vals=[pairs.map((p,i)=>normalized(p.a,metrics.get(axes[i].benchmark_id))),pairs.map((p,i)=>normalized(p.b,metrics.get(axes[i].benchmark_id)))];
 const meta=clear($('model-meta'));[a,b].forEach((m,i)=>{const n=el('div',null,meta);el('h3',(i?'B · ':'A · ')+m.name,n);el('p',param(m)+' · '+(m.license||'license unknown'),n);if(!eligible(m,{family:state.family,license:$('license-filter').value,max:$('params-filter').value}))el('p','Pinned outside your current filters',n,'filter-warning');});
 const shared=pairs.filter(p=>p.a&&p.b).length;
 $('radar-coverage').textContent=shared+' of '+axes.length+' dimensions comparable';
 const relevant=axes.map((c,i)=>({c,p:pairs[i]})).find(({c,p})=>(tasks.get(state.task)?.benchmark_ids||[]).includes(c.benchmark_id)&&p.a&&p.b);
 $('radar-task-reading').textContent=relevant?'For '+tasks.get(state.task).label.toLowerCase()+': '+metrics.get(relevant.c.benchmark_id).label+' measures one relevant capability.':'This pair has no shared score directly mapped to your selected task.';
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
 $('shortlist-summary').textContent='A · '+a.name+'  /  B · '+b.name;
}

// 05 — task-specific score–size map and an empirical Pareto frontier.
function prepareTaskMeasure(){const t=tasks.get(state.task),ids=t?.benchmark_ids||[];opts('task-metric',ids.length?ids.map(id=>[id,metrics.get(id)?.label||id]):[['','No direct benchmark collected']],$('task-metric').value);prepareTaskProtocol();}
function candidates(){return data.models.filter(m=>eligible(m,{family:state.family,license:$('license-filter').value,max:$('params-filter').value}));}
function prepareTaskProtocol(){const groups=protocolGroups(data,$('task-metric').value,candidates().map(m=>m.id));opts('task-protocol',groups.length?groups.map(g=>[g.id,g.models.size+' measured models · '+settingName(g.row)]):[['','No measurement available']],$('task-protocol').value);}
function candidateScore(m){return available(data,m.id,$('task-metric').value).find(r=>r.comparability_group===$('task-protocol').value)||null;}
function renderMapping(){
 const task=tasks.get(state.task),pills=clear($('task-pills'));data.tasks.forEach(t=>{const b=el('button',t.label,pills);b.setAttribute('aria-pressed',String(t.id===state.task));b.onclick=()=>setTask(t.id);});
 const all=candidates(),m=metrics.get($('task-metric').value),measured=all.map(model=>({model,row:candidateScore(model)})).filter(d=>d.row);
 const plotted=measured.filter(d=>Number.isFinite(d.model.parameters_total_b)&&d.model.parameters_total_b>0);
 const frontier=paretoFrontier(plotted.map(d=>({id:d.model.id,score:d.row.score,parameters:d.model.parameters_total_b}))),frontIds=new Set(frontier.map(d=>d.id));
 $('matrix-note').textContent=measured.length+' measured candidates · '+all.length+' meet your constraints'+(m?' · '+m.label:'');
 $('task-mapping-method').textContent=task?.mapping_rationale||'No direct benchmark mapping is available for this task.';
 if(!all.some(v=>v.id===state.candidateFocus))state.candidateFocus=frontier.slice().sort((a,b)=>a.parameters-b.parameters)[0]?.id||measured[0]?.model.id||all[0]?.id||null;
 const sort=$('candidate-sort').value,rows=[...all].sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='size'?(a.parameters_total_b??Infinity)-(b.parameters_total_b??Infinity)||a.name.localeCompare(b.name):(candidateScore(b)?.score??-Infinity)-(candidateScore(a)?.score??-Infinity)||a.name.localeCompare(b.name));
 const list=clear($('candidate-list'));rows.forEach(model=>{const r=candidateScore(model),b=el('button',null,list,'candidate-row');b.setAttribute('aria-pressed',String(model.id===state.candidateFocus));const title=el('span',model.name,b);el('small',param(model),title);el('strong',r?String(r.score):'No score',b);b.onclick=()=>{state.candidateFocus=model.id;state.focus=model.id;renderMapping();renderEvolution();};});
 if(!plotted.length){empty('task-mapping',!all.length?'No models meet these constraints. Try another family, license or size limit.':!m?'This task has discussion evidence, but no direct benchmark in this collection. Inspect the candidate evidence before deciding what to test.':'No score–size pairs in this source. Choose another evaluation source or relax the constraints.');$('mapping-insight').textContent=measured.length?measured.length+' scored models have unknown sizes; inspect them in the candidate list.':'The available evidence cannot support a measured shortlist for these filters.';renderCandidate();return;}
 const w=850,h=475,s=svg('task-mapping',w,h),margin={l:65,r:35,t:38,b:65};
 const extent=d3.extent(plotted,d=>d.model.parameters_total_b),x=d3.scaleLog().domain([extent[0]*.8,extent[1]*1.25]).range([margin.l,w-margin.r]);
 const scoreExtent=d3.extent(plotted,d=>d.row.score),span=Math.max(10,scoreExtent[1]-scoreExtent[0]),lo=Math.max(m.range_min,Math.floor((scoreExtent[0]-span*.15)/5)*5),hi=Math.min(m.range_max,Math.ceil((scoreExtent[1]+span*.18)/5)*5);
 const y=d3.scaleLinear().domain([lo,hi>lo?hi:lo+1]).range([h-margin.b,margin.t]);
 s.append('g').attr('class','grid').attr('transform','translate('+margin.l+',0)').call(d3.axisLeft(y).ticks(5).tickSize(-(w-margin.l-margin.r)).tickFormat('')).call(g=>g.select('.domain').remove());
 s.append('g').attr('transform','translate(0,'+(h-margin.b)+')').call(d3.axisBottom(x).ticks(6, '~g'));
 s.append('g').attr('transform','translate('+margin.l+',0)').call(d3.axisLeft(y).ticks(5));
 text(s,margin.l,18,m.label+' · '+m.unit+' (zoomed scale)','mark-label');
 text(s,(w+margin.l)/2,h-14,'Total parameters (billions) · log scale','mark-label').attr('text-anchor','middle');
 const sorted=frontier.slice().sort((a,b)=>a.parameters-b.parameters);
 if(sorted.length>1)s.append('path').attr('class','frontier-line').attr('d',d3.line().x(d=>x(d.parameters)).y(d=>y(d.score))(sorted)).attr('fill','none').attr('stroke','#c43d61').attr('stroke-width',1.5).attr('stroke-dasharray','5 5').attr('opacity',.6);
 const dots=s.selectAll('g.candidate-mark').data(plotted,d=>d.model.id).join('g').attr('class','candidate-mark');
 const pairPoints=plotted.filter(d=>[state.a,state.b].includes(d.model.id));
 if(pairPoints.length===2)s.insert('line','.candidate-mark').attr('x1',x(pairPoints[0].model.parameters_total_b)).attr('y1',y(pairPoints[0].row.score)).attr('x2',x(pairPoints[1].model.parameters_total_b)).attr('y2',y(pairPoints[1].row.score)).attr('stroke','#322e35').attr('stroke-width',1).attr('stroke-dasharray','2 4').attr('opacity',.45);
 dots.filter(d=>frontIds.has(d.model.id)).append('circle').attr('cx',d=>x(d.model.parameters_total_b)).attr('cy',d=>y(d.row.score)).attr('r',11).attr('fill','none').attr('stroke','#c43d61').attr('stroke-width',1.5);
 const points=dots.append('circle').attr('class','mapping-point').attr('cx',d=>x(d.model.parameters_total_b)).attr('cy',d=>y(d.row.score)).attr('r',d=>d.model.id===state.candidateFocus?7.5:6).attr('fill',d=>color(d.model.family_id)).attr('stroke',d=>d.model.id===state.candidateFocus?'#322e35':'#fffaf5').attr('stroke-width',2);
 active(points,(e,d)=>{state.candidateFocus=d.model.id;state.focus=d.model.id;renderMapping();renderEvolution();},d=>d.model.name+', '+d.row.score+' '+m.unit+', '+param(d.model)+'. Inspect candidate.');
 points.on('pointermove',(e,d)=>tip(e,d.model.name+'\n'+param(d.model)+' · '+m.label+': '+d.row.score+'\n'+(frontIds.has(d.model.id)?'On the size–score frontier':'Click to inspect and compare'))).on('pointerleave',hideTip);
 pairPoints.forEach(d=>text(s,x(d.model.parameters_total_b),y(d.row.score)+3,d.model.id===state.a?'A':'B').attr('text-anchor','middle').style('fill','white').style('font-size','8px').style('font-weight',700).style('pointer-events','none'));
 const labelBoxes=[];plotted.filter(d=>d.model.id===state.candidateFocus||frontIds.has(d.model.id)).sort((a,b)=>Number(b.model.id===state.candidateFocus)-Number(a.model.id===state.candidateFocus)).slice(0,7).forEach(d=>{
 const px=x(d.model.parameters_total_b),py=y(d.row.score),label=d.model.name.length>30?d.model.name.slice(0,29)+'…':d.model.name;
 const t=text(s,0,0,label,'mark-label').style('font-size','10px').style('pointer-events','none'),box=t.node().getBBox();let placed=false;
 for(const [dx,dy]of [[13,-12],[13,20],[-13,-12],[-13,22],[13,-28],[-13,34]]){const left=dx>0?px+dx:px+dx-box.width,top=py+dy-box.height,b={x:left,y:top,w:box.width+5,h:box.height+5};if(b.x<margin.l||b.x+b.w>w-margin.r||b.y<margin.t||b.y+b.h>h-margin.b)continue;if(labelBoxes.some(q=>b.x<q.x+q.w&&b.x+b.w>q.x&&b.y<q.y+q.h&&b.y+b.h>q.y))continue;t.attr('x',left).attr('y',py+dy);labelBoxes.push(b);placed=true;break;}if(!placed)t.remove();
 });
 const focused=plotted.find(d=>d.model.id===state.candidateFocus),dominator=focused?plotted.filter(d=>d.model.parameters_total_b<=focused.model.parameters_total_b&&d.row.score>=focused.row.score&&(d.model.parameters_total_b<focused.model.parameters_total_b||d.row.score>focused.row.score)).sort((a,b)=>a.model.parameters_total_b-b.model.parameters_total_b)[0]:null;
 let insight=frontier.length+' size–score frontier choices among '+plotted.length+' measured candidates. ';
 if(dominator){const gain=dominator.row.score-focused.row.score,saving=focused.model.parameters_total_b-dominator.model.parameters_total_b;insight+=dominator.model.name+(gain?' scores '+gain.toFixed(1)+' points higher':' matches the selected score')+(saving?' with '+saving.toFixed(2)+'B fewer parameters.':' at the same parameter count.');}
 else if(sorted.length>1){const first=sorted[0],last=sorted.at(-1);insight+='From the smallest to the highest-scoring frontier choice: +'+(last.parameters-first.parameters).toFixed(2)+'B parameters, +'+(last.score-first.score).toFixed(1)+' '+m.label+' points.';}
 else insight+='Select a dot to inspect its source and add it to your comparison.';
 $('mapping-insight').textContent=insight+(measured.length>plotted.length?' '+(measured.length-plotted.length)+' scored models with unknown size appear in the candidate list.':'');
 renderCandidate();
}
function renderCandidate(){
 const m=models.get(state.candidateFocus),task=tasks.get(state.task),p=clear($('candidate-evidence'));if(!m||!task){el('p','Select a candidate to inspect the evidence.',p);return;}
 el('h3',m.name,p);el('p',param(m)+' · '+(m.license||'license unknown'),p);
 const r=candidateScore(m);const score=el('strong',r?String(r.score):'No score',p,'candidate-score');el('small',r?metrics.get(r.benchmark_id).label+' · '+r.unit:'No shared task measurement in this source',score);actions(p,m.id);
 if(r)sources(p,r.source_urls);
 const exact=feedbackRows(task.id,'model',m.id),family=feedbackRows(task.id,'family',m.family_id);
 const d=el('details',null,p);el('summary','Discussion evidence · '+fmt(total(exact))+' exact-model records',d);if(total(exact)){el('p',fmt(total(exact,'actual_experience_count'))+' rule-identified uses/problems. Model attribution is unvalidated.',d);showExcerpts(d,exact);}else el('p','No exact-model task feedback is attributed in this sample.',d);
 if(total(family)){const fd=el('details',null,p);el('summary',fmt(total(family))+' family-level task mentions',fd);el('p','Context for the family; not a rating of this variant.',fd);showExcerpts(fd,family);}
 const pd=el('details',null,p);el('summary','Practical checks before choosing',pd);el('p','Check licensing, memory, latency and failure cases on your own task. Parameters do not determine GPU memory.',pd);
 for(const id of ['latency','memory']){const c=data.concerns.find(c=>c.id===id),buckets=data.concern_buckets.filter(b=>b.concern_id===id&&b.scope==='family'&&b.entity_id===m.family_id&&matchFeedback(b,state));el('p',c.label+': '+fmt(total(buckets))+' family mentions; no controlled measurement.',pd);}
}
function exportBrief(){
 const task=tasks.get(state.task),lines=['# MLLM evidence shortlist','Task: '+task.label,'Snapshot: '+data.generated_at,
 'Exploration filters — family: '+state.family+'; license: '+$('license-filter').value+'; parameter cap: '+$('params-filter').value,
 'Pinned comparison models may be outside these filters; eligibility is reported below.','',
 'This is a research shortlist, not a deployment recommendation.',''];
 for(const slot of ['a','b']){
  const m=models.get(state[slot]),within=eligible(m,{family:state.family,license:$('license-filter').value,max:$('params-filter').value});
  lines.push('## Model '+slot.toUpperCase()+': '+m.name,param(m)+'; license: '+m.license,
   'Meets current metadata filters: '+(within?'yes':'NO — pinned outside current filters'),'Sources: '+m.source_urls.join(' '));
  for(const mid of task.benchmark_ids){const p=pairScores(data,state.a,state.b,mid,state.groups[mid]),r=slot==='a'?p.a:p.b;lines.push(metrics.get(mid).label+': '+(r?r.score+' '+r.unit+'; '+r.comparability_status+'; '+r.source_urls.join(' '):'No shared-group measurement'));}
  lines.push('Exact-model task discussion records: '+total(feedbackRows(task.id,'model',m.id)),'');
 }
 lines.push('Limits: labels are rule-generated, source-biased and not human-validated. Family-only feedback is not model-specific. Speed/memory not controlled. Check the source protocols and test your own data.');
 const blob=new Blob([lines.join('\n')],{type:'text/markdown'}),url=URL.createObjectURL(blob),a=el('a',null,document.body);a.href=url;a.download='mllm-evidence-shortlist.md';a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function findings(){const box=clear($('findings-grid'));const quant=total(data.growth.repository_creation.filter(r=>r.repo_type==='quantization'));const entries=[[(100*quant/data.counts.repositories).toFixed(1)+'%','Derivatives shape the ecosystem',`${fmt(quant)} repositories are classified as quantizations. Repository growth should not be equated with new architectures.`],[(100*data.counts.task_labeled_feedback/data.counts.feedback).toFixed(1)+'%','Task evidence is sparse',`${fmt(data.counts.task_labeled_feedback)} of ${fmt(data.counts.feedback)} records received task labels. The rest cannot be silently assigned a task.`],[fmt(data.counts.exact_model_feedback),'Exact-model records',`Only ${(100*data.counts.exact_model_feedback/data.counts.feedback).toFixed(1)}% of records map to a canonical model. Most practical discussion remains family-level.`]];for(const [n,title,body]of entries){const a=el('article',null,box);el('strong',n,a);el('h3',title,a);el('p',body,a);}}
function stopStory(){if(timer)clearInterval(timer);timer=null;$('story-play').textContent='Play story';}
function wire(){
 let compactLayout=innerWidth<650;window.addEventListener('resize',()=>{const next=innerWidth<650;if(next!==compactLayout){compactLayout=next;renderCloud();renderRadar();}});
 $('family-filter').onchange=e=>{state.family=e.target.value;refresh();};$('platform-filter').onchange=e=>{state.platform=e.target.value;renderCloud();renderMapping();};$('experience-filter').onchange=e=>{state.experience=e.target.value;renderCloud();};
 $('reset').onclick=()=>{
 stopStory();Object.assign(state,{family:'all',platform:'all',experience:'all',cloud:'all',concern:'documents',task:'document-understanding',stage:0,growthFocus:null,page:0,candidateFocus:null,a:data.radar_defaults.pair[0],b:data.radar_defaults.pair[1],focus:data.radar_defaults.pair[0],groups:{...data.radar_defaults.groups}});
 $('family-filter').value='all';$('platform-filter').value='all';$('experience-filter').value='all';$('params-filter').value='all';$('license-filter').value='all';$('date-from').value=data.periods[0];$('date-to').value=data.periods.at(-1);$('model-search').value='';$('radar-mode').value='concerns';$('evolution-metric').value='mmmu';$('growth-mode').value='repository_creation';$('growth-group').value='family';$('pair-status').textContent='';$('selected-task-label').textContent=tasks.get(state.task).label;prepareTaskMeasure();refresh();
 };
 for(const id of ['growth-mode','growth-group','growth-measure','date-from','date-to'])$(id).onchange=()=>{state.growthFocus=null;renderGrowth();};$('growth-unfocus').onclick=()=>{state.growthFocus=null;$('date-from').value=data.periods[0];$('date-to').value=data.periods.at(-1);renderGrowth();};
 document.querySelectorAll('[data-cloud]').forEach(b=>b.onclick=()=>{state.cloud=b.dataset.cloud;document.querySelectorAll('[data-cloud]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCloud();});
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stopStory();state.stage=+b.dataset.stage;renderEvolution();});$('story-play').onclick=()=>{if(timer){stopStory();return;}state.stage=0;renderEvolution();$('story-play').textContent='Pause story';timer=setInterval(()=>{state.stage++;renderEvolution();if(state.stage===2)stopStory();},3500);};$('reduce-motion').onchange=()=>{stopStory();renderEvolution();};document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStory();});
 $('model-search').oninput=renderEvolution;$('evolution-metric').onchange=()=>{prepareEvolutionProtocol();renderEvolution();};$('evolution-protocol').onchange=renderEvolution;
 ['a','b'].forEach(slot=>$('model-'+slot).onchange=e=>assignModel(slot,e.target.value));$('radar-mode').onchange=()=>{if(sharedCoverage(data,state.a,state.b,comparisonMetrics())<MIN_SHARED)assignModel('a',state.a);else{renderRadar();renderModelEvidence();renderCandidate();}};
 for(const id of ['license-filter','params-filter'])$(id).onchange=()=>{state.candidateFocus=null;prepareTaskProtocol();renderMapping();renderRadar();};$('task-metric').onchange=()=>{state.candidateFocus=null;prepareTaskProtocol();renderMapping();};$('task-protocol').onchange=()=>{state.candidateFocus=null;renderMapping();};$('candidate-sort').onchange=renderMapping;$('export-shortlist').onclick=exportBrief;
}
async function init(){try{
 if(typeof d3==='undefined')throw new Error('The bundled D3 library did not load.');const response=await fetch('data/final/explorer_data.json');if(!response.ok)throw new Error(`Data request failed (${response.status})`);data=await response.json();models=new Map(data.models.map(m=>[m.id,m]));tasks=new Map(data.tasks.map(t=>[t.id,t]));metrics=new Map(data.metrics.map(m=>[m.id,m]));
 const canonicalFamilies=[...new Set(data.models.map(m=>m.family_id))].sort(),other=data.families.map(f=>f.id).filter(f=>!canonicalFamilies.includes(f));color=d3.scaleOrdinal().domain([...canonicalFamilies,...other]).range([...palette,...other.map((f,i)=>d3.hsl((i*137.5+20)%360,.42,.48).formatHex())]);const defaultPair=data.radar_defaults.pair;state.a=defaultPair[0];state.b=defaultPair[1];state.focus=state.a;state.groups={...data.radar_defaults.groups};
 opts('family-filter',[['all','All families'],...data.families.map(f=>[f.id,f.label])],'all');opts('license-filter',[['all','All / unknown included'],...[...new Set(data.models.map(m=>m.license||'unknown'))].sort().map(l=>[l,l])],'all');const choices=data.models.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(m=>[m.id,m.name]);opts('model-a',choices,state.a);opts('model-b',choices,state.b);opts('evolution-metric',data.metrics.map(m=>[m.id,m.label]),'mmmu');$('reduce-motion').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;$('date-from').value=data.periods[0];$('date-to').value=data.periods.at(-1);['date-from','date-to'].forEach(id=>{$(id).min=data.periods[0];$(id).max=data.periods.at(-1);});
 const stats=clear($('summary'));[[data.counts.repositories,'unique retained model repositories'],[data.counts.feedback,'distinct community records'],[data.models.length,'canonical comparison models'],[data.tasks.length,'rule-supported task categories']].forEach(([n,t])=>{const p=el('div',null,stats);el('strong',fmt(n),p);el('span',t,p);});
 $('load-status').textContent=`Snapshot: ${data.generated_at.slice(0,10)} · Source-linked, reproducible data · Feedback labels remain unvalidated.`;
 wire();prepareTaskMeasure();$('selected-task-label').textContent=tasks.get(state.task).label;refresh();findings();document.body.dataset.ready='true';if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant'}));}
 }catch(error){$('load-status').textContent=`Unable to load the atlas: ${error.message}. See the repository and saved views in the footer.`;$('load-status').className='error';console.error(error);}}
init();
