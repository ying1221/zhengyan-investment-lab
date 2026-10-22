import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {analyze} from '../src/engine.js';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let attempts=0;
 await page.route('**/api/analyze',async route=>{
  attempts++;const result=analyze(route.request().postDataJSON());
  result.runId='test-ui-diagnostics';
  result.model=attempts===1?{status:'fallback',provider:'DeepSeek',model:'deepseek-flash',elapsedMs:340,code:'INSUFFICIENT_BALANCE',diagnostics:{httpStatus:402,stage:'response',thinking:'disabled',timeoutMs:45000},message:'DeepSeek 返回余额不足（HTTP 402），请在官方平台核对账户额度。规则验证结果保留。'}:{status:'ok',provider:'DeepSeek',model:'deepseek-flash',elapsedMs:600,diagnostics:{httpStatus:200,stage:'complete',finishReason:'stop',outputChars:68},message:'大模型已调用；引用 ID 已校验，正文仍需人工核对。',output:{subquestions:['主营归因还缺少什么？'],explanation:'有盈利增长证据，但仍缺分部利润归因，不保证收益。[E1]',citations:['E1']}};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
 });
 await page.goto('http://127.0.0.1:4173/?settings=1');await page.locator('#api-key').fill('test-ui-key-not-real');await page.locator('#use-model').check();await page.getByRole('button',{name:'应用设置'}).click();await page.getByRole('button',{name:/拆解命题/}).click();await page.getByRole('button',{name:/确认口径/}).click();
 await page.getByRole('heading',{name:'模型辅助未完成'}).waitFor();assert.ok(await page.getByText('INSUFFICIENT_BALANCE',{exact:true}).isVisible());assert.ok(await page.getByRole('button',{name:'导出诊断记录'}).isVisible());await page.locator('.model-status').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/06-model-diagnostics.png'});console.log('PASS 模型失败时主区域明确展示原因、HTTP与导出入口（替身）');
 await page.getByRole('button',{name:'重新调用模型'}).click();await page.getByRole('heading',{name:'DeepSeek 调用成功'}).waitFor();await page.getByRole('heading',{name:/模型辅助解释/}).waitFor();assert.equal(attempts,2);assert.deepEqual(errors,[]);console.log('PASS 用户手动重试后展示实际返回状态与模型解释（替身）');
 await writeFile('artifacts/model-ui-qa.json',JSON.stringify({date:'2026-10-22',tests:2,passed:2,network:'stubbed; no real provider request',errors},null,2));
}finally{await browser.close();}
