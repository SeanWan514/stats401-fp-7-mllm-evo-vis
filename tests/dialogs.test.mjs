import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const html=read('index.html'),js=read('explorer.js');

test('each help link opens a named native dialog with close and focus support',()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const targets=[...html.matchAll(/data-modal-target="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(targets.length,7);
 for(const id of targets){assert.ok(ids.has(id));assert.ok(html.includes(`<dialog id="${id}"`));assert.ok(ids.has(id+'-title'));}
 assert.equal((html.match(/<dialog /g)||[]).length,10);
 assert.equal((html.match(/class="modal-close"/g)||[]).length,10);
 assert.ok(js.includes('dialog.showModal()'));assert.ok(js.includes("d.addEventListener('close'"));
 assert.ok(js.includes('returnFocus'));assert.ok(read('dialogs.css').includes('::backdrop'));
});
test('five visualization sections no longer expand support content or expose global/pair clutter',()=>{
 const charts=html.slice(html.indexOf('<section class="chapter shell" id="growth">'),html.indexOf('<section class="shell conclusions"'));
 assert.ok(!charts.includes('<details'));assert.ok(!charts.includes('chapter-next'));
 for(const id of ['family-filter','selected-task-label','reset','shortlist-summary','export-shortlist','growth-insight','date-from','date-to'])assert.ok(!html.includes(`id="${id}"`),id);
 assert.ok(!html.includes('YOUR EXPLORATION'));assert.ok(!charts.includes('YOUR SHORTLIST'));
 const section=js.slice(js.indexOf('// 03 —'),js.indexOf('// 04 —'));
 assert.ok(!/state\.a\b|state\.b\b|actions\(/.test(section));
});
test('literal DOM references resolve after removal of the exploration bar',()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(id)||id==='selection-toast',id);
});
test('rollback page uses its own frozen scripts and styles from the previous release',()=>{
 // Captured from bfe6314 before edits; independent of CI's shallow Git checkout.
 const snapshots={
  'pre-modal.html':'9cca142094e121cce847dfcf48490fc9bc6df2cc7e750b999fb23753c9254013',
  'pre-modal.js':'55a6f0d39c50579dff8050faa1a1dcdcffb88660a5e305773b8fe942fc4b6043',
  'pre-modal.css':'a64f156f4a644d93b28d44ea9d6c81309e7b7047279b0a3f73d5ebc4117fa6cd',
  'pre-modal-core.mjs':'93eb4d022faf845ce754dad6c195e4588543ad39b39ead3fbeb272779f78dc53'
 };
 for(const [file,hash] of Object.entries(snapshots))assert.equal(createHash('sha256').update(read(file).trimEnd()).digest('hex'),hash,file);
});
