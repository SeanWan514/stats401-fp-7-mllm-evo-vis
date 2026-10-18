const DATA_URL = "data/interim_models.json";
const COLORS = { coral: "#be4f55", coralLight: "#ef7d78", blue: "#3b6d8c", teal: "#278a82", navy: "#25364d", gold: "#c58a29", muted: "#9d8b90", red: "#c33f4b" };

const state = { data: null, models: [], metrics: [], metric: "mmmu", landscape: "overall", releaseYear: 2025, timer: null };
const tooltip = d3.select("#tooltip");

function showTooltip(event, html) {
  tooltip.html(html).attr("hidden", null);
  const node = tooltip.node();
  const x = Math.min(event.clientX + 14, window.innerWidth - node.offsetWidth - 12);
  const y = Math.min(event.clientY + 14, window.innerHeight - node.offsetHeight - 12);
  tooltip.style("left", `${Math.max(8, x)}px`).style("top", `${Math.max(8, y)}px`);
}
function hideTooltip() { tooltip.attr("hidden", true); }
function fmt(value, digits = 1) { return value == null ? "Not reported" : d3.format(`,.${digits}f`)(value); }
function metricById(id) { return state.metrics.find(d => d.id === id); }
function score(model, id) { return model.scores?.[id]; }
function chartSize(selector, fallback = 920) { return Math.max(320, Math.min(fallback, document.querySelector(selector)?.clientWidth || fallback)); }
function clear(selector) { d3.select(selector).selectAll("*").remove(); }
function addSvg(selector, width, height) { clear(selector); return d3.select(selector).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true"); }
function modelTip(d) {
  const metric = metricById(state.metric);
  return `<strong>${d.name}</strong><br>${d.organization}<br>${d.release_date || "Date not reported"}<br>${metric.label}: ${fmt(score(d, state.metric))}<br>Parameters: ${d.parameters_label}`;
}

function populateSummary() {
  const p = state.data.profile;
  d3.select("#stat-models").text(d3.format(",")(p.model_records));
  d3.select("#stat-open").text(d3.format(",")(p.open_weight_models));
  d3.select("#stat-blocks").text(d3.format(",")(p.benchmark_blocks));
  d3.select("#stat-values").text(d3.format(",")(p.numeric_measurements));
}

function fillMetricSelect(id) {
  d3.select(id).selectAll("option").data(state.metrics).join("option").attr("value", d => d.id).text(d => d.label);
}

function setupControls() {
  fillMetricSelect("#heatmap-sort"); fillMetricSelect("#scatter-metric");
  d3.select("#heatmap-sort").property("value", state.metric).on("change", e => drawHeatmap(e.target.value));
  d3.select("#scatter-metric").property("value", state.metric).on("change", e => { state.metric = e.target.value; drawScatter(); drawLandscape(); });
  d3.select("#scatter-open").on("change", drawScatter);
  const options = state.models.filter(d => d.score_count >= 4).sort((a,b) => d3.ascending(a.name,b.name));
  ["#radar-model-a", "#radar-model-b"].forEach(id => d3.select(id).selectAll("option").data(options).join("option").attr("value", d => d.id).text(d => d.name));
  const find = name => options.find(d => d.name === name)?.id;
  d3.select("#radar-model-a").property("value", find("Qwen2.5-VL-7B") || options[0]?.id);
  d3.select("#radar-model-b").property("value", find("InternVL3-8B") || options[1]?.id);
  d3.selectAll("#radar-model-a,#radar-model-b").on("change", drawRadar);
  d3.select("#release-year").on("input", e => { stopRelease(); state.releaseYear = +e.target.value; d3.select("#release-year-output").text(state.releaseYear); drawRelease(); });
  d3.select("#release-play").on("click", toggleRelease);
  d3.selectAll(".landscape-button").on("click", function() { state.landscape = this.dataset.landscape; d3.selectAll(".landscape-button").classed("active", false); d3.select(this).classed("active", true); drawLandscape(); });
}

function toggleRelease() {
  if (state.timer) { stopRelease(); return; }
  if (state.releaseYear >= 2025) state.releaseYear = 2023;
  d3.select("#release-play").text("Pause history");
  d3.select("#release-year").property("value", state.releaseYear); d3.select("#release-year-output").text(state.releaseYear); drawRelease();
  state.timer = setInterval(() => {
    if (state.releaseYear >= 2025) { stopRelease(); return; }
    state.releaseYear += 1; d3.select("#release-year").property("value", state.releaseYear); d3.select("#release-year-output").text(state.releaseYear); drawRelease();
  }, 1150);
}
function stopRelease() { if (state.timer) clearInterval(state.timer); state.timer = null; d3.select("#release-play").text("Play history"); }

function drawRelease() {
  const width = chartSize("#release-chart"), height = 390, margin = {top:30,right:28,bottom:48,left:56};
  const svg = addSvg("#release-chart", width, height);
  const verified = state.models.filter(d => d.release_date && +d.release_date.slice(0,4) <= 2025);
  const rows = d3.range(2023, 2026).map(year => ({ year, open: verified.filter(d => +d.release_date.slice(0,4) === year && d.open_weight).length, closed: verified.filter(d => +d.release_date.slice(0,4) === year && !d.open_weight).length }));
  const active = rows.filter(d => d.year <= state.releaseYear);
  const x = d3.scaleBand().domain(rows.map(d => d.year)).range([margin.left,width-margin.right]).padding(.34);
  const y = d3.scaleLinear().domain([0,d3.max(rows,d => d.open+d.closed)]).nice().range([height-margin.bottom,margin.top]);
  svg.append("g").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickFormat(d3.format("d"))).call(g=>g.select(".domain").remove());
  svg.append("g").attr("transform",`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5)).call(g=>g.select(".domain").remove());
  svg.append("g").attr("stroke","#eadbd8").selectAll("line").data(y.ticks(5)).join("line").attr("x1",margin.left).attr("x2",width-margin.right).attr("y1",y).attr("y2",y);
  const groups = svg.selectAll(".year-bar").data(active,d=>d.year).join("g").attr("class","year-bar").attr("transform",d=>`translate(${x(d.year)},0)`);
  groups.append("rect").attr("x",0).attr("width",x.bandwidth()).attr("y",y(0)).attr("height",0).attr("rx",7).attr("fill",COLORS.teal).transition().duration(650).attr("y",d=>y(d.open)).attr("height",d=>y(0)-y(d.open));
  groups.append("rect").attr("x",0).attr("width",x.bandwidth()).attr("y",d=>y(d.open)).attr("height",0).attr("rx",7).attr("fill",COLORS.navy).attr("opacity",.88).transition().duration(650).attr("y",d=>y(d.open+d.closed)).attr("height",d=>y(d.open)-y(d.open+d.closed));
  groups.append("text").attr("x",x.bandwidth()/2).attr("y",d=>y(d.open+d.closed)-10).attr("text-anchor","middle").attr("font-weight",700).text(d=>d.open+d.closed);
  svg.append("text").attr("x",margin.left).attr("y",18).attr("font-weight",700).text("Models released in snapshot");
}

function drawRadar() {
  const a = state.models.find(d => d.id === d3.select("#radar-model-a").property("value"));
  const b = state.models.find(d => d.id === d3.select("#radar-model-b").property("value"));
  if (!a || !b) return;
  const width = chartSize("#radar-chart",760), height = 500, cx=width/2, cy=height/2+8, radius=Math.min(width,height)*.34;
  const svg = addSvg("#radar-chart",width,height); const angle = i => -Math.PI/2+i*2*Math.PI/state.metrics.length;
  const extents = Object.fromEntries(state.metrics.map(m => [m.id,d3.extent(state.models,d=>score(d,m.id))]));
  const normalized = (model,m) => { const v=score(model,m.id), [lo,hi]=extents[m.id]; return v==null?0:(v-lo)/(hi-lo||1); };
  [ .25,.5,.75,1 ].forEach(level => { const points=state.metrics.map((m,i)=>[cx+Math.cos(angle(i))*radius*level,cy+Math.sin(angle(i))*radius*level]); svg.append("polygon").attr("points",points.map(p=>p.join(",")).join(" ")).attr("fill","none").attr("stroke","#eadbd8"); });
  state.metrics.forEach((m,i)=>{ const x=cx+Math.cos(angle(i))*radius,y=cy+Math.sin(angle(i))*radius; svg.append("line").attr("x1",cx).attr("y1",cy).attr("x2",x).attr("y2",y).attr("stroke","#eadbd8"); const lx=cx+Math.cos(angle(i))*(radius+30),ly=cy+Math.sin(angle(i))*(radius+30); svg.append("text").attr("x",lx).attr("y",ly).attr("text-anchor",Math.abs(lx-cx)<10?"middle":lx>cx?"start":"end").attr("dominant-baseline","middle").text(m.label.replace(" overall","").replace(" validation","")); });
  const line=d3.line().curve(d3.curveLinearClosed); [[a,COLORS.coral],[b,COLORS.blue]].forEach(([model,color])=>{ const pts=state.metrics.map((m,i)=>[cx+Math.cos(angle(i))*radius*normalized(model,m),cy+Math.sin(angle(i))*radius*normalized(model,m)]); svg.append("path").attr("d",line(pts)).attr("fill",color).attr("fill-opacity",.16).attr("stroke",color).attr("stroke-width",3); svg.append("g").selectAll("circle").data(pts.map((p,i)=>({p,m:state.metrics[i]}))).join("circle").attr("cx",d=>d.p[0]).attr("cy",d=>d.p[1]).attr("r",5).attr("fill",color).on("mousemove",(e,d)=>showTooltip(e,`<strong>${model.name}</strong><br>${d.m.label}: ${fmt(score(model,d.m.id))}`)).on("mouseleave",hideTooltip); });
  svg.append("text").attr("x",18).attr("y",26).attr("fill",COLORS.coral).attr("font-weight",700).text(a.name);
  svg.append("text").attr("x",18).attr("y",48).attr("fill",COLORS.blue).attr("font-weight",700).text(b.name);
}

function drawHeatmap(sortId = state.metric) {
  const width=chartSize("#heatmap-chart"), rowH=27, labelW=Math.min(220,width*.28), top=70, right=15;
  const candidates=state.models.filter(d=>d.score_count>=5).sort((a,b)=>(score(b,sortId)??-Infinity)-(score(a,sortId)??-Infinity)).slice(0,24);
  const height=top+candidates.length*rowH+20, svg=addSvg("#heatmap-chart",width,height), cellW=(width-labelW-right)/state.metrics.length;
  const extents=Object.fromEntries(state.metrics.map(m=>[m.id,d3.extent(state.models,d=>score(d,m.id))]));
  state.metrics.forEach((m,i)=>svg.append("text").attr("transform",`translate(${labelW+i*cellW+cellW/2},${top-12}) rotate(-35)`).attr("text-anchor","start").text(m.id.toUpperCase()));
  const rows=svg.selectAll(".heat-row").data(candidates).join("g").attr("class","heat-row").attr("transform",(d,i)=>`translate(0,${top+i*rowH})`).style("cursor","pointer").on("click",(e,d)=>{d3.select("#radar-model-a").property("value",d.id);drawRadar();document.querySelector("#radar-model-a").scrollIntoView({behavior:"smooth",block:"center"});});
  rows.append("text").attr("x",labelW-8).attr("y",rowH*.67).attr("text-anchor","end").text(d=>d.name.length>27?`${d.name.slice(0,25)}…`:d.name);
  rows.each(function(model){ const g=d3.select(this); state.metrics.forEach((m,i)=>{ const v=score(model,m.id),[lo,hi]=extents[m.id],t=v==null?null:(v-lo)/(hi-lo||1); g.append("rect").attr("x",labelW+i*cellW+1).attr("width",cellW-2).attr("height",rowH-2).attr("rx",3).attr("fill",t==null?"#f0e8e6":d3.interpolateRgb("#fff0ed","#c94f59")(t)).on("mousemove",e=>showTooltip(e,`<strong>${model.name}</strong><br>${m.label}: ${fmt(v)}`)).on("mouseleave",hideTooltip); if(v==null)g.append("text").attr("x",labelW+i*cellW+cellW/2).attr("y",rowH*.67).attr("text-anchor","middle").text("×"); }); });
}

function drawScatter() {
  const openOnly=d3.select("#scatter-open").property("checked"), data=state.models.filter(d=>d.parameters_b>0&&score(d,state.metric)!=null&&(!openOnly||d.open_weight));
  const width=chartSize("#scatter-chart"),height=430,m={top:28,right:25,bottom:58,left:68},svg=addSvg("#scatter-chart",width,height);
  const x=d3.scaleLog().domain(d3.extent(data,d=>d.parameters_b)).nice().range([m.left,width-m.right]),y=d3.scaleLinear().domain(d3.extent(data,d=>score(d,state.metric))).nice().range([height-m.bottom,m.top]);
  svg.append("g").attr("transform",`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).ticks(6,"~g")); svg.append("g").attr("transform",`translate(${m.left},0)`).call(d3.axisLeft(y));
  svg.append("text").attr("x",(m.left+width-m.right)/2).attr("y",height-12).attr("text-anchor","middle").text("Reported parameters (billions, log scale)"); svg.append("text").attr("transform",`translate(16,${height/2}) rotate(-90)`).attr("text-anchor","middle").text(metricById(state.metric).label);
  svg.selectAll("circle").data(data).join("circle").attr("cx",d=>x(d.parameters_b)).attr("cy",d=>y(score(d,state.metric))).attr("r",5).attr("fill",d=>d.open_weight?COLORS.teal:"white").attr("stroke",d=>d.open_weight?"white":COLORS.navy).attr("stroke-width",1.8).attr("opacity",.78).on("mousemove",(e,d)=>showTooltip(e,modelTip(d))).on("mouseleave",hideTooltip);
  const sorted=[...data].sort((a,b)=>a.parameters_b-b.parameters_b), frontier=[]; let best=-Infinity; sorted.forEach(d=>{const v=score(d,state.metric);if(v>best){frontier.push(d);best=v;}});
  svg.append("path").datum(frontier).attr("d",d3.line().x(d=>x(d.parameters_b)).y(d=>y(score(d,state.metric)))).attr("fill","none").attr("stroke",COLORS.red).attr("stroke-width",2).attr("stroke-dasharray","6 5");
}

function drawLandscape() {
  const data=state.models.filter(d=>d.release_date&&+d.release_date.slice(0,4)<=2025),width=chartSize("#landscape-chart"),height=470,m={top:25,right:25,bottom:58,left:150},svg=addSvg("#landscape-chart",width,height);
  const dates=data.map(d=>new Date(d.release_date)),x=d3.scaleTime().domain(d3.extent(dates)).range([m.left,width-m.right]); let y,label;
  if(state.landscape==="overall"){const vals=data.map(d=>score(d,state.metric)).filter(v=>v!=null);y=d3.scaleLinear().domain(d3.extent(vals)).nice().range([height-m.bottom,m.top]);label=metricById(state.metric).label;}
  else {const key=state.landscape==="language"?"language_family":"vision_family";const counts=d3.rollups(data,v=>v.length,d=>d[key]).sort((a,b)=>b[1]-a[1]);const top=counts.slice(0,10).map(d=>d[0]);y=d3.scalePoint().domain(top).range([m.top,height-m.bottom]).padding(.5);label=state.landscape==="language"?"Language backbone family":"Vision encoder family";}
  svg.append("g").attr("transform",`translate(0,${height-m.bottom})`).call(d3.axisBottom(x).ticks(5)); svg.append("g").attr("transform",`translate(${m.left},0)`).call(state.landscape==="overall"?d3.axisLeft(y):d3.axisLeft(y));
  svg.append("text").attr("transform",`translate(18,${height/2}) rotate(-90)`).attr("text-anchor","middle").text(label);
  const providers=[...new Set(data.map(d=>d.organization_group))],color=d3.scaleOrdinal(providers,d3.schemeTableau10);
  const shown=data.filter(d=>state.landscape==="overall"?score(d,state.metric)!=null:y.domain().includes(d[state.landscape==="language"?"language_family":"vision_family"]));
  svg.selectAll("circle").data(shown).join("circle").attr("cx",d=>x(new Date(d.release_date))).attr("cy",d=>state.landscape==="overall"?y(score(d,state.metric)):y(d[state.landscape==="language"?"language_family":"vision_family"])).attr("r",d=>d.parameters_b?Math.max(3,Math.min(10,Math.sqrt(d.parameters_b))):3.2).attr("fill",d=>color(d.organization_group)).attr("opacity",.65).attr("stroke","white").on("mousemove",(e,d)=>showTooltip(e,modelTip(d))).on("mouseleave",hideTooltip);
}

function drawNetwork() {
  const width=chartSize("#network-chart"),height=560,svg=addSvg("#network-chart",width,height),nodes=state.data.network.nodes.map(d=>({...d})),links=state.data.network.links.map(d=>({...d}));
  const sim=d3.forceSimulation(nodes).force("link",d3.forceLink(links).id(d=>d.id).distance(115).strength(.45)).force("charge",d3.forceManyBody().strength(-250)).force("x",d3.forceX(d=>d.type==="provider"?width*.28:width*.72).strength(.18)).force("y",d3.forceY(height/2).strength(.08)).force("collide",d3.forceCollide(d=>Math.sqrt(d.count)*2.2+20));
  const link=svg.append("g").selectAll("line").data(links).join("line").attr("stroke","#d8c5c2").attr("stroke-width",d=>Math.max(1,Math.sqrt(d.value||d.count||1)));
  const node=svg.append("g").selectAll("g").data(nodes).join("g").style("cursor","default"); node.append("circle").attr("r",d=>Math.max(7,Math.min(21,Math.sqrt(d.count)*3))).attr("fill",d=>d.type==="provider"?COLORS.navy:COLORS.coral).attr("stroke","white").attr("stroke-width",2); node.append("text").attr("x",d=>d.type==="provider"?-13:13).attr("text-anchor",d=>d.type==="provider"?"end":"start").attr("dy",".35em").text(d=>d.label);
  node.on("mouseenter",(e,d)=>{const neighbors=new Set([d.id]);links.forEach(l=>{const s=l.source.id||l.source,t=l.target.id||l.target;if(s===d.id)neighbors.add(t);if(t===d.id)neighbors.add(s);});node.attr("opacity",n=>neighbors.has(n.id)?1:.12);link.attr("opacity",l=>(l.source.id===d.id||l.target.id===d.id)?1:.08);showTooltip(e,`<strong>${d.label}</strong><br>${d.type}<br>${d.count} model records`);}).on("mouseleave",()=>{node.attr("opacity",1);link.attr("opacity",1);hideTooltip();});
  sim.on("tick",()=>{nodes.forEach(d=>{d.x=Math.max(90,Math.min(width-90,d.x));d.y=Math.max(35,Math.min(height-35,d.y));});link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);node.attr("transform",d=>`translate(${d.x},${d.y})`);});
}

function drawAll() { drawRelease(); drawRadar(); drawHeatmap(); drawScatter(); drawLandscape(); drawNetwork(); }

d3.json(DATA_URL).then(data => {
  state.data=data; state.models=data.models; state.metrics=data.metrics;
  populateSummary(); setupControls(); drawAll();
  let resizeTimer; window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawAll,220);});
}).catch(error => {
  console.error(error);
  d3.select("#visualizations").insert("p",":first-child").attr("class","source-note").text("The visualization data could not be loaded. Please serve this page through a web server and try again.");
});
