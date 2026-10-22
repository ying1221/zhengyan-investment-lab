import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {metrics} from '../src/engine.js';
const [jsonPath,reportPath]=process.argv.slice(2);
if(!jsonPath||!reportPath)throw Error('Usage: node scripts/audit-live-run.mjs <export.json> <report.md>');
const [jsonBytes,reportBytes]=await Promise.all([readFile(jsonPath),readFile(reportPath)]);
const record=JSON.parse(jsonBytes.toString('utf8').replace(/^\uFEFF/,'')),r=record.result,md=reportBytes.toString('utf8');
assert.equal(r.model.status,'ok');assert.equal(r.model.diagnostics.httpStatus,200);assert.equal(r.model.diagnostics.stage,'complete');assert.equal(r.model.diagnostics.finishReason,'stop');
const expected=metrics();for(const [key,value]of Object.entries(expected))assert.ok(Math.abs(r.metrics[key]-value)<1e-9,`Mismatch: ${key}`);
const ids=new Set(r.evidence.map(e=>e.id));assert.equal(ids.size,r.evidence.length);
const refs=[...r.model.output.explanation.matchAll(/\[(E\d+)\]/g)].map(m=>m[1]);
assert.ok(refs.every(id=>ids.has(id)&&r.model.output.citations.includes(id)));assert.ok(r.model.output.citations.every(id=>refs.includes(id)));
assert.ok(md.includes(r.model.output.explanation));assert.ok(md.includes(r.runId));assert.ok(md.includes(r.summary));
for(const e of r.evidence){assert.ok(md.includes(e.id));assert.ok(md.includes(e.fact));assert.ok(md.includes(e.reading));}
assert.ok(!/"(?:apiKey|DEEPSEEK_API_KEY|authorization)"\s*:|\bsk-[A-Za-z0-9]{12,}/i.test(jsonBytes.toString('utf8')));
await mkdir('artifacts',{recursive:true});
await Promise.all([copyFile(jsonPath,'artifacts/真实调用验证记录.json'),copyFile(reportPath,'artifacts/真实调用研究报告.md')]);
const audit={date:'2026-10-22',runId:r.runId,generatedAt:r.generatedAt,provider:r.model.provider,model:r.model.model,elapsedMs:r.model.elapsedMs,sha256:{json:createHash('sha256').update(jsonBytes).digest('hex'),report:createHash('sha256').update(reportBytes).digest('hex')},checks:{metricsRecomputed:Object.keys(expected).length,citationsExistAndMatch:true,reportAndExportAgree:true,noCredentialFields:true},semanticReview:'See docs/真实调用逐项核验.md; manual review, not automatic proof of all semantic claims',singleRunOnly:true};
await writeFile('artifacts/live-run-audit.json',JSON.stringify(audit,null,2));
// Curated public financial example. Preserve the original result verbatim; archive metadata is separate.
await writeFile('src/verified-example.json',JSON.stringify({...record,archive:{kind:'verified-historical-run',reviewed:'2026-10-22',runId:r.runId,label:'真实模型调用归档 · 2026-10-22 17:41（北京时间）',notice:'这是已完成研究的历史记录；查看归档不发起新的模型请求。'}},null,2));
console.log(JSON.stringify({runId:r.runId,elapsedMs:r.model.elapsedMs,metricsChecked:Object.keys(expected).length,citations:[...new Set(refs)],reportConsistent:true,noCredentialsFound:true}));
