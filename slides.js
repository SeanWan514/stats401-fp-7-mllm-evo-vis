// Presentation shell only: preserve the chart DOM, its data, and its selections.
export const PAGE_IDS=Object.freeze(['cover','top','mission','context','goals','dataset','growth','tasks','evolution','radar','matrix','findings','methods','closing']);

export function shouldHandlePageKey(event,{modalOpen=false}={}){
  if(modalOpen||event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return false;
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return false;
  const target=event.target;
  if(target?.isContentEditable)return false;
  return !target?.closest?.('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"], [role="textbox"], [role="combobox"], [role="listbox"], [role="button"]');
}

function initializeSlides(){
  const pages=PAGE_IDS.map(id=>document.getElementById(id)).filter(node=>node?.classList.contains('story-slide'));
  const nav=document.getElementById('page-nav'),previous=document.getElementById('page-prev'),next=document.getElementById('page-next'),status=document.getElementById('page-status');
  if(!pages.length||!nav||!previous||!next||!status)return;
  const contents=new Map(pages.map(page=>[page.id,page.querySelector(':scope > .slide-content')]));
  const titles=new Map(pages.map(page=>[page.id,page.dataset.pageTitle||page.querySelector('h1,h2')?.textContent.trim()||page.id]));
  const narrow=matchMedia('(max-width: 760px), (max-height: 560px)');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,frame=0,enterFrame=0;

  function fitCurrent(){
    frame=0;
    const page=pages[current],content=contents.get(page.id);
    if(!content)return;
    if(narrow.matches){content.style.setProperty('--slide-scale','1');content.style.setProperty('--slide-offset','0px');page.dataset.layout='scroll';return;}
    page.dataset.layout='fit';
    const naturalHeight=Math.max(content.offsetHeight,content.scrollHeight,1),naturalWidth=Math.max(content.offsetWidth,content.scrollWidth,1);
    const availableHeight=Math.max(1,page.clientHeight-32),availableWidth=Math.max(1,page.clientWidth-112);
    const scale=Math.min(1,availableHeight/naturalHeight,availableWidth/naturalWidth);
    const offset=16+Math.max(0,(availableHeight-naturalHeight*scale)/2);
    content.style.setProperty('--slide-scale',String(Math.round(scale*100000)/100000));
    content.style.setProperty('--slide-offset',String(Math.round(offset))+'px');
  }
  function scheduleFit(){if(!frame)frame=requestAnimationFrame(fitCurrent);}
  function slideForTarget(id){
    const clean=String(id||'').replace(/^#/,'');
    if(PAGE_IDS.includes(clean))return pages.find(page=>page.id===clean)||null;
    const target=document.getElementById(clean);
    return target?.closest('.story-slide')||null;
  }
  function hashTarget(){
    try{return slideForTarget(decodeURIComponent(location.hash.slice(1)));}catch{return null;}
  }
  function focusPage(page){
    const heading=page.querySelector('h1,h2')||page;
    if(!heading.hasAttribute('tabindex'))heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
  }
  function show(id,{historyMode='push',focus=true}={}){
    const selected=slideForTarget(id);
    if(!selected)return;
    const ready=document.body.classList.contains('slides-ready');
    const index=pages.indexOf(selected),changed=index!==current||!ready;
    const animate=changed&&ready&&!reduceMotion.matches,direction=index>=current?1:-1;
    const oldId=pages[current]?.id;
    if(changed){
      document.querySelectorAll('dialog[open]').forEach(dialog=>{dialog.returnFocus=null;dialog.dataset.returnSection='';dialog.close();});
      document.body.classList.remove('modal-open');
    }
    if(enterFrame){cancelAnimationFrame(enterFrame);enterFrame=0;}
    current=index;
    pages.forEach((page,i)=>{
      const active=i===current;
      page.style.setProperty('--page-exit-shift',(-direction*10)+'px');
      page.style.setProperty('--page-enter-shift',(direction*10)+'px');
      page.classList.toggle('is-entering',active&&animate);
      page.classList.toggle('is-active',active);
      page.inert=!active;
      page.setAttribute('aria-hidden',String(!active));
      page.setAttribute('aria-label','Page '+(i+1)+' of '+pages.length+': '+titles.get(page.id));
      if(active)page.scrollTop=0;
    });
    nav.querySelectorAll('button[data-page]').forEach(button=>{
      const active=button.dataset.page===selected.id;
      if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    previous.disabled=current===0;next.disabled=current===pages.length-1;
    previous.setAttribute('aria-label',current?'Previous page: '+titles.get(pages[current-1].id):'Previous page');
    next.setAttribute('aria-label',current<pages.length-1?'Next page: '+titles.get(pages[current+1].id):'Next page');
    status.textContent=String(current+1).padStart(2,'0')+' / '+String(pages.length).padStart(2,'0')+' · '+titles.get(selected.id);
    document.body.dataset.storyPage=selected.id;
    document.body.classList.add('slides-ready');
    if(historyMode!=='none'&&location.hash!=='#'+selected.id){
      const method=historyMode==='replace'?'replaceState':'pushState';
      history[method]({...history.state,storyPage:selected.id},'',location.pathname+location.search+'#'+selected.id);
    }
    fitCurrent();
    if(animate){
      // Establish a start frame, then transition the existing page—never its chart DOM.
      selected.getBoundingClientRect();
      enterFrame=requestAnimationFrame(()=>{selected.classList.remove('is-entering');enterFrame=0;});
    }
    if(focus&&changed)focusPage(selected);
    if(changed)document.dispatchEvent(new CustomEvent('story:pagechange',{detail:{id:selected.id,previousId:oldId,index:current}}));
  }

  nav.replaceChildren();
  pages.forEach((page,index)=>{
    const button=document.createElement('button');button.type='button';button.dataset.page=page.id;
    button.className='page-segment';button.setAttribute('aria-controls',page.id);
    button.setAttribute('aria-label','Page '+(index+1)+' of '+pages.length+': '+titles.get(page.id));
    const line=document.createElement('span');line.className='page-segment-line';line.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.className='page-segment-label';label.textContent=(index+1)+' · '+titles.get(page.id);label.setAttribute('aria-hidden','true');
    button.append(line,label);button.addEventListener('click',()=>show(page.id));nav.append(button);
  });
  previous.type='button';next.type='button';previous.classList.add('page-arrow');next.classList.add('page-arrow');
  previous.textContent='‹';next.textContent='›';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  previous.addEventListener('click',()=>{if(current>0)show(pages[current-1].id);});
  next.addEventListener('click',()=>{if(current<pages.length-1)show(pages[current+1].id);});
  document.addEventListener('keydown',event=>{
    if(!shouldHandlePageKey(event,{modalOpen:!!document.querySelector('dialog[open]')}))return;
    const index=event.key==='Home'?0:event.key==='End'?pages.length-1:current+(event.key==='ArrowRight'?1:-1);
    if(index<0||index>=pages.length)return;
    event.preventDefault();show(pages[index].id);
  });
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
    const anchor=event.target.closest?.('a[href^="#"]');
    if(!anchor||anchor.hasAttribute('download')||anchor.target==='_blank'||anchor.closest('dialog[open]'))return;
    if(anchor.classList.contains('skip')){event.preventDefault();focusPage(pages[current]);return;}
    let target;try{target=slideForTarget(decodeURIComponent(anchor.getAttribute('href').slice(1)));}catch{return;}
    if(target){event.preventDefault();show(target.id);}
    else if(anchor.getAttribute('href')==='#main'){event.preventDefault();focusPage(pages[current]);}
  });
  document.addEventListener('story:navigate',event=>{if(event.detail?.id)show(event.detail.id);});
  document.addEventListener('story:ready',scheduleFit);
  const restore=()=>{const target=hashTarget();if(target)show(target.id,{historyMode:'none'});};
  window.addEventListener('popstate',restore);window.addEventListener('hashchange',restore);
  window.addEventListener('resize',scheduleFit);window.visualViewport?.addEventListener('resize',scheduleFit);
  narrow.addEventListener('change',scheduleFit);
  const resizeObserver=new ResizeObserver(scheduleFit),mutationObserver=new MutationObserver(scheduleFit);
  for(const content of contents.values())if(content){
    resizeObserver.observe(content);
    // Style writes made by fitting are deliberately NOT observed, avoiding a loop.
    mutationObserver.observe(content,{childList:true,subtree:true,characterData:true});
  }
  document.fonts?.ready.then(scheduleFit);
  const initial=hashTarget()||pages[0];show(initial.id,{historyMode:location.hash?'none':'replace',focus:false});
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeSlides,{once:true});else initializeSlides();
}
