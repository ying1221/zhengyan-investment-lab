import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const key='secret-only-for-tests';
const request=()=>new Request('https://test.example/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({input:'美的集团 2024 年盈利改善主要来自主营业务',useModel:true,apiKey:key})});
const valid={subquestions:['主营归因还缺哪些证据？'],explanation:'经常性盈利有改善证据，但分部利润归因仍缺材料，不提供仓位建议，也不保证收益。[E1]',citations:['E1']};
async function run(mock){const saved=globalThis.fetch;try{globalThis.fetch=mock;return await (await worker.fetch(request(),{})).json();}finally{globalThis.fetch=saved;}}
test('明确关闭默认思考并设置前后端一致的等待预算',async()=>{let payload;const r=await run(async(url,opts)=>{assert.equal(url,'https://api.deepseek.com/chat/completions');payload=JSON.parse(opts.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(valid)}}]});});assert.deepEqual(payload.thinking,{type:'disabled'});assert.equal(payload.stream,false);assert.equal(payload.max_tokens,1800);assert.equal(r.model.status,'ok');assert.equal(r.model.diagnostics.timeoutMs,45000);assert.equal(r.model.diagnostics.stage,'complete');});
test('正常拒绝交易建议不被关键词误拦，实际交易指令仍拒绝',async()=>{for(const explanation of [valid.explanation,'不能保证收益，不建议买入。[E1]','不提供目标价或仓位建议。[E1]']){const r=await run(async()=>Response.json({choices:[{message:{content:JSON.stringify({...valid,explanation})}}]}));assert.equal(r.model.status,'ok');}for(const explanation of ['建议立即买入，保证收益。[E1]','推荐加仓。[E1]','目标价：120 元，仓位 80%。[E1]']){const r=await run(async()=>Response.json({choices:[{message:{content:JSON.stringify({...valid,explanation})}}]}));assert.equal(r.model.code,'COMPLIANCE_REJECTED');}});
test('401/402/422/429/503 各有明确错误，原始密钥不会进入结果',async()=>{for(const [status,expected]of [[401,'AUTH_FAILED'],[402,'INSUFFICIENT_BALANCE'],[422,'REQUEST_REJECTED'],[429,'RATE_LIMIT'],[503,'PROVIDER_UNAVAILABLE']]){const r=await run(async()=>new Response(JSON.stringify({error:{message:key}}),{status}));assert.equal(r.model.code,expected);assert.equal(r.model.diagnostics.httpStatus,status);assert.ok(!JSON.stringify(r).includes(key));assert.equal(r.status,'qualified');}});
test('截断、空正文、坏JSON、结构和引用问题分别定位',async()=>{const samples=[
 [{finish_reason:'length',message:{content:'{"subquestions":'}},'OUTPUT_TRUNCATED'],
 [{finish_reason:'stop',message:{content:''}},'EMPTY_OUTPUT'],
 [{message:{content:'not json'}},'JSON_INVALID'],
 [{message:{content:JSON.stringify({...valid,subquestions:[]})}},'SCHEMA_INVALID'],
 [{message:{content:JSON.stringify({...valid,explanation:'见[E999]',citations:['E999']})}},'CITATION_INVALID']
 ];for(const [choice,expected]of samples){const r=await run(async()=>Response.json({choices:[choice]}));assert.equal(r.model.code,expected);assert.equal(r.model.status,'fallback');assert.ok(!r.model.output);}});
test('网络和真实 abort 错误清楚区分且不转发错误原文',async()=>{for(const [error,expected]of [[new DOMException('secret detail','TimeoutError'),'MODEL_TIMEOUT'],[new Error(key),'NETWORK_ERROR']]){const r=await run(async()=>{throw error;});assert.equal(r.model.code,expected);assert.ok(!JSON.stringify(r).includes(key));assert.ok(!JSON.stringify(r).includes('secret detail'));}});
