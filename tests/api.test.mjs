import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const code=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const input='美的集团 2024 年盈利改善主要来自主营业务';
const req=(body,headers={})=>new Request('https://test.example/api/analyze',{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
test('页面与健康接口正常响应',async()=>{assert.equal((await worker.fetch(new Request('https://test.example/'),{})).status,200);assert.equal((await (await worker.fetch(new Request('https://test.example/api/health'),{})).json()).mode,'rules-only');});
test('真实 API 主链路产出追溯记录，序列化中没有请求密钥',async()=>{const r=await worker.fetch(req({input,apiKey:'test-sensitive-key'}),{}),text=await r.text();assert.equal(r.status,200);assert.ok(!text.includes('test-sensitive-key'));const data=JSON.parse(text);assert.equal(data.model.status,'not-requested');assert.ok(data.runId);});
test('损坏 JSON / 类型 / 阈值 / 跨站输入受控失败',async()=>{assert.equal((await worker.fetch(req('{'),{})).status,400);assert.equal((await worker.fetch(req({input:23}),{})).status,400);assert.equal((await worker.fetch(req({input,threshold:20}),{})).status,400);assert.equal((await worker.fetch(req({input},{origin:'https://attacker.example'}),{})).status,403);});
test('未配置模型如实降级，来源超时停止数值结论',async()=>{const r=await (await worker.fetch(req({input,useModel:true}),{})).json();assert.equal(r.model.status,'not-configured');const f=await (await worker.fetch(req({input,fault:'source-timeout'}),{})).json();assert.equal(f.metrics,null);});
test('模型超时注入保留规则，绝不返回 ok',async()=>{const r=await (await worker.fetch(req({input,useModel:true,apiKey:'test-only',fault:'model-timeout'}),{})).json();assert.equal(r.model.status,'fallback');assert.equal(r.status,'qualified');});
test('模型伪造引用、429、401和合法结构分别处理（网络替身）',async()=>{const saved=globalThis.fetch;try{
 for(const status of [401,429]){globalThis.fetch=async()=>new Response('{}',{status});const r=await (await worker.fetch(req({input,useModel:true,apiKey:'test-only'}),{})).json();assert.equal(r.model.status,'fallback');assert.equal(r.model.code,status===401?'AUTH_FAILED':'RATE_LIMIT');}
 const output={subquestions:['盈利增长是否真实？'],explanation:'必须回到证据 [E999] 核验。',citations:['E999']};
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify(output)}}]});let r=await (await worker.fetch(req({input,useModel:true,apiKey:'test-only'}),{})).json();assert.equal(r.model.status,'fallback');
 output.explanation='盈利增长有数据支持，但仍有反证和主营归因缺口 [E1]。';output.citations=['E1'];r=await (await worker.fetch(req({input,useModel:true,apiKey:'test-only'}),{})).json();assert.equal(r.model.status,'ok');assert.equal(r.status,'qualified');
 }finally{globalThis.fetch=saved;}});
