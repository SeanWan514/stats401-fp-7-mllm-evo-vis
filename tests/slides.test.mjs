import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PAGE_IDS,shouldHandlePageKey} from '../slides.js';

const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const html=read('index.html'),baseline=read('pre-slides.html');
const expected=['cover','top','mission','context','goals','dataset','growth','tasks','evolution','radar','matrix','findings','methods','closing'];
const chartIds=['growth','tasks','evolution','radar','matrix'];
const normalize=s=>s.trim().replace(/\s+/g,' ');

// Balanced tag extraction handles the nested sections/divs in dialogs and cards
// without depending on a browser, an external parser, or Git history in CI.
function element(source,tag,id){
 const pattern=new RegExp(`<${tag}\\b[^>]*\\bid="${id}"[^>]*>`),match=source.match(pattern);
 assert.ok(match,`${tag}#${id} exists`);
 return balanced(source,tag,match.index,match[0]);
}
function balanced(source,tag,start,opening){
 const tokens=new RegExp(`<\\/?${tag}\\b[^>]*>`,'g');
 tokens.lastIndex=start+opening.length;let depth=1;
 for(let m;(m=tokens.exec(source));){
  depth+=m[0].startsWith('</')?-1:1;
  if(depth===0)return {opening,inner:source.slice(start+opening.length,m.index),outer:source.slice(start,tokens.lastIndex)};
 }
 assert.fail(`Unclosed ${tag} starting at ${start}`);
}
function slideInner(id){
 const section=element(html,'section',id),inner=section.inner.trim();
 const opening=inner.match(/^<div\b[^>]*class="[^"]*\bslide-content\b[^"]*"[^>]*>/);
 assert.ok(opening,`${id} starts with a slide-content wrapper`);
 const wrapper=balanced(inner,'div',0,opening[0]);
 assert.equal(wrapper.outer.length,inner.length,`${id} wrapper contains all slide content`);
 return wrapper.inner;
}

test('presentation has exactly fourteen named slides in the agreed narrative order',()=>{
 const slides=[...html.matchAll(/<section\b[^>]*class="[^"]*\bstory-slide\b[^"]*"[^>]*>/g)].map(m=>m[0]);
 assert.equal(slides.length,14);
 assert.deepEqual(slides.map(tag=>tag.match(/\bid="([^"]+)"/)?.[1]),expected);
 assert.deepEqual([...PAGE_IDS],expected);
 for(const tag of slides)assert.ok(/\bdata-page-title="[^"]+"/.test(tag),'each page has a readable navigation title');
 for(const id of expected)assert.ok(slideInner(id).length>0);
});

test('all five chart interiors are preserved from the pre-slide release',()=>{
 for(const id of chartIds){
  assert.equal(normalize(slideInner(id)),normalize(element(baseline,'section',id).inner),`${id}: only its slide wrapper may change`);
 }
});

test('chart rendering and analysis code changes only at the explicit task-page navigation handoff',()=>{
 const original=read('pre-slides.js'),current=read('explorer.js');
 const charts=source=>{
  const from=source.indexOf('// 01 —'),through=source.indexOf('function findings()');
  assert.ok(from>=0&&through>from,'all five visualization implementations are present');
  return source.slice(from,through);
 };
 const previousNavigation="$('matrix').scrollIntoView({behavior:'instant'});";
 const slideNavigation="document.dispatchEvent(new CustomEvent('story:navigate',{detail:{id:'matrix'}}));";
 assert.equal(charts(original).split(previousNavigation).length,2,'one prior task handoff');
 assert.equal(charts(current).split(slideNavigation).length,2,'one new task handoff');
 assert.equal(charts(current),charts(original).replace(previousNavigation,slideNavigation));
});

test('all ten original evidence dialogs remain intact alongside five new explanatory dialogs',()=>{
 const dialogIds=[...baseline.matchAll(/<dialog\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(dialogIds.length,10);
 assert.equal((html.match(/<dialog\b/g)||[]).length,15);
 for(const id of dialogIds){
  assert.equal(normalize(element(html,'dialog',id).outer),normalize(element(baseline,'dialog',id).outer),id);
 }
 for(const id of expected)assert.ok(!slideInner(id).includes('<dialog'),`${id}: dialogs must not be clipped by slide containers`);
});

test('visualization defaults remain intact except for the requested visual-QA starting task',()=>{
 const js=read('explorer.js'),original=read('pre-slides.js');
 const getState=source=>source.match(/const state=({[^\n]+});/)?.[1];
 assert.ok(getState(js)&&getState(original));
 assert.equal(getState(js),getState(original).replace("task:'document-understanding'","task:'visual-qa'"));
 assert.ok(js.includes("'repository_creation'")||html.includes('<option value="repository_creation">'));
 assert.ok(html.includes('<option value="family">Model family</option>'));
 assert.ok(html.includes('data-stage="0" aria-pressed="true"'));
 assert.ok(html.includes('<option value="all">All discussions, including questions</option>'));
});

test('pre-slides rollback assets are frozen independently of shallow Git history',()=>{
 // Full-byte hashes captured from the six fallback files at baseline 07b1582.
 const snapshots={
  'pre-slides.html':'be599c7f7be11a7d3592d1cb41011a0b3c6ab755f6cc9653d870dce17f110e87',
  'pre-slides.js':'25349f9d6115718d0ea96626eb19ffb3bc37fc22dcbf47a2eeed13e477d33126',
  'pre-slides.css':'9dfbe5f4b5ab9419c6947557628452cd3b5c56cb2d15adda00b1665b07c0aef1',
  'pre-slides-core.mjs':'8a2cebe9820e79e68584b1fd98b47721ae70050a4eefade18bd53d8f1f61de47',
  'pre-slides-dialogs.css':'b4ed39cfbcd8f19548879772e1e612aa8d1c3897ec505dda1397bf52b6496229',
  'pre-slides-task-selection.css':'75fe475183a9b79f012590b163783ebe28c2dcd3670fb58ac027657171c38418'
 };
 for(const [file,hash] of Object.entries(snapshots))assert.equal(createHash('sha256').update(read(file)).digest('hex'),hash,file);
 for(const file of ['pre-slides.js','pre-slides.css','pre-slides-dialogs.css','pre-slides-task-selection.css'])assert.ok(baseline.includes(`"${file}"`),file);
 assert.ok(read('pre-slides.js').includes("from './pre-slides-core.mjs'"));
});

test('the public bundle and release verifier include the slideshow and all rollback assets',()=>{
 const build=read('scripts/build_static_site.py'),verify=read('scripts/verify_deployed_site.py');
 const additions=['slides.js','slides.css','pre-slides.html','pre-slides.js','pre-slides.css','pre-slides-core.mjs','pre-slides-dialogs.css','pre-slides-task-selection.css'];
 for(const file of additions){assert.ok(build.includes(`"${file}"`),`build ${file}`);assert.ok(verify.includes(`'${file}'`),`verify ${file}`);}
 assert.ok(build.includes('"slide-layout-checklist.md"'));
 const fileBlock=verify.match(/FILES = (\[[\s\S]*?\])/)[1];
 assert.equal([...fileBlock.matchAll(/'([^']+)'/g)].length,23);
 assert.ok(read('Makefile').includes('node --check slides.js'));
});

test('page-key handling yields to dialogs, editing and chart controls',()=>{
 const event=(key,extra={})=>({key,defaultPrevented:false,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,target:{closest:()=>null,isContentEditable:false},...extra});
 for(const key of ['ArrowLeft','ArrowRight','Home','End'])assert.equal(shouldHandlePageKey(event(key)),true,key);
 for(const key of ['ArrowUp','ArrowDown','Enter','Escape',' ','Tab'])assert.equal(shouldHandlePageKey(event(key)),false,key);
 for(const key of ['defaultPrevented','altKey','ctrlKey','metaKey','shiftKey'])assert.equal(shouldHandlePageKey(event('ArrowRight',{[key]:true})),false,key);
 assert.equal(shouldHandlePageKey(event('ArrowRight'),{modalOpen:true}),false);
 assert.equal(shouldHandlePageKey(event('ArrowLeft',{target:{closest:()=>({}),isContentEditable:false}})),false);
 assert.equal(shouldHandlePageKey(event('ArrowLeft',{target:{closest:()=>null,isContentEditable:true}})),false);
 for(const control of ['input','textarea','select','button','a','[role="slider"]','[role="button"]','[role="listbox"]']){
  const target={isContentEditable:false,closest:selector=>selector.split(/,\s*/).includes(control)?{}:null};
  assert.equal(shouldHandlePageKey(event('ArrowRight',{target})),false,`${control} keeps its own arrow-key behavior`);
 }
});
