const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup(status=200,data={ok:true}){
 const state={cleared:0,redirects:0,calls:[],token:'test-jwt'};
 const context=vm.createContext({window:{LUDUS_API_BASE_URL:'https://api.test/'},getAuthToken:()=>state.token,clearAuthSession:()=>state.cleared++,requireAuth:()=>state.redirects++,fetch:async(url,options)=>{state.calls.push({url,options});return new Response(status===204?null:JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Retry-After':'3'}});}});
 vm.runInContext(fs.readFileSync('JS/api.js','utf8'),context);return {state,api:context.consumeApi};
}
test('configurable base, JWT and body serialized once',async()=>{const {state,api}=setup(201);await api('/ludus/publicacion/igdb/42',{method:'POST',body:{texto:'Opinion',calificacion:4.5}});assert.equal(state.calls[0].url,'https://api.test/ludus/publicacion/igdb/42');assert.equal(state.calls[0].options.headers.Authorization,'Bearer test-jwt');assert.deepEqual(JSON.parse(state.calls[0].options.body),{texto:'Opinion',calificacion:4.5});});
test('204 returns null',async()=>{assert.equal(await setup(204).api('/ludus/publicacion/1',{method:'DELETE'}),null);});
for(const status of [400,403,404,409,502,503,504])test('preserves HTTP '+status+' and Retry-After',async()=>{await assert.rejects(setup(status,{message:'Error'}).api('/test'),e=>e.status===status&&e.retryAfter==='3');});
test('401 clears session and redirects protected access',async()=>{const {state,api}=setup(401);await assert.rejects(api('/test'),e=>e.status===401);assert.equal(state.cleared,1);assert.equal(state.redirects,1);});
test('missing JWT prevents request and redirects',async()=>{const {state,api}=setup();state.token=null;await assert.rejects(api('/test'),e=>e.status===401);assert.equal(state.calls.length,0);assert.equal(state.redirects,1);});
test('public login error does not redirect',async()=>{const {state,api}=setup(401);await assert.rejects(api('/ludus/login',{auth:false,method:'POST',body:{}}));assert.equal(state.redirects,0);assert.equal(state.calls[0].options.headers.Authorization,undefined);});
test('invalid endpoint rejected',async()=>{const {state,api}=setup();await assert.rejects(api('https://other.test'));assert.equal(state.calls.length,0);});
