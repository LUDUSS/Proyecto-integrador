// Chrome DevTools: estados CSS reales y modal Bootstrap, sin acceso al backend.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let ws, browser;const results=[];let seq=0;const pending=new Map();
 try{
  for(let i=0;i<80;i++){try{browser=await (await fetch('http://127.0.0.1:9226/json/version')).json();break;}catch{await wait(100);}}
  assert(browser,'Chrome debugging endpoint unavailable');
  const pages=await (await fetch('http://127.0.0.1:9226/json/list')).json();
  ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
  await call('DOM.enable');await call('CSS.enable');await call('Page.navigate',{url:'http://127.0.0.1:5510/tests/button-themes.html'});
  for(let i=0;i<200;i++){if(await evaluate('window.__themeReady'))break;const errors=await evaluate('window.__themeErrors');if(errors?.length)throw Error(errors.join('; '));await wait(100);}
  assert(await evaluate('window.__themeReady'),'Theme fixture did not finish');
  const {root}=await call('DOM.getDocument');
  const check=(ok,label)=>{assert(ok,label);results.push('PASS '+label);};
  for(const mode of ['light','dark'])for(const palette of ['neon','sunset','forest','cyber']){
   await evaluate(`(()=>{if(document.documentElement.dataset.bsTheme!==${JSON.stringify(mode)})document.getElementById('theme-toggle').click();document.querySelector('[data-palette-set="${palette}"]').click();})()`);
   for(const selector of ['#explore','#cancel','#danger']){
    const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector});
    await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['hover']});
    const hover=await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(n),c=document.createElement('canvas'),ctx=c.getContext('2d');const rgb=v=>{ctx.fillStyle=v;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].join(',');};return {bg:rgb(s.backgroundColor),expected:rgb(s.getPropertyValue('--ludus-action-hover')),image:s.backgroundImage,color:s.color};})()`);
    check(selector==='#explore'?hover.image.includes('gradient'):selector==='#cancel'?hover.bg===hover.expected:!!hover.color,mode+'/'+palette+' '+selector+' hover');
    await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['focus-visible']});
    const focus=await evaluate(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(selector)}));return s.outlineStyle==='solid'&&s.outlineWidth==='2px';})()`);
    check(focus,mode+'/'+palette+' '+selector+' focus-visible');
    await call('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});
   }
  }
  for(const width of [320,390,1280]){
   await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
   check(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width+'px no horizontal overflow');
   await evaluate("new Promise((resolve,reject)=>{const m=document.getElementById('game-review-modal');const timer=setTimeout(()=>reject(Error('Modal did not open')),3000);m.addEventListener('shown.bs.modal',()=>{clearTimeout(timer);resolve(true);},{once:true});document.querySelector('#editor > button').click();})");
   check(await evaluate("document.getElementById('game-review-modal').classList.contains('show')&&[...document.querySelectorAll('#game-review-modal .modal-footer button')].every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})"),width+'px modal actions remain within viewport');
   await evaluate("new Promise((resolve,reject)=>{const m=document.getElementById('game-review-modal');const timer=setTimeout(()=>reject(Error('Modal did not close')),3000);m.addEventListener('hidden.bs.modal',()=>{clearTimeout(timer);resolve(true);},{once:true});document.querySelector('#game-review-modal .modal-footer button').click();})");
   check(await evaluate("!document.body.classList.contains('modal-open')&&!document.querySelector('.modal-backdrop')"),width+'px Bootstrap modal closes cleanly');
  }
  fs.writeFileSync('tests/button-states-result.txt',results.join('\n')+'\nALL PASSED\n');console.log(results.length+' CSS/viewport checks passed');
 }catch(e){fs.writeFileSync('tests/button-states-result.txt',results.join('\n')+'\nFAIL '+e.stack+'\n');console.error(e);process.exitCode=1;}
 finally{
  if(ws)ws.close();
  if(browser){const control=new WebSocket(browser.webSocketDebuggerUrl);await new Promise(resolve=>{control.onopen=()=>{control.send(JSON.stringify({id:1,method:'Browser.close'}));resolve();};control.onerror=resolve;});}
 }
})();
