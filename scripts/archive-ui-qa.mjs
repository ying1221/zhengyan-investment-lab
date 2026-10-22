import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true});const results=[];
try{
 const page=await b.newPage({viewport:{width:1440,height:960}});let calls=0;page.on('request',r=>{if(r.url().includes('/api/analyze'))calls++;});
 await page.goto((process.env.BASE_URL||'http://127.0.0.1:4173')+'/?example=verified');await page.getByRole('heading',{name:'历史记录：DeepSeek 调用成功'}).waitFor();
 assert.equal(calls,0);assert.ok(await page.getByLabel('历史归档说明').isVisible());assert.ok(await page.getByText('这是已完成研究的历史记录；查看归档不发起新的模型请求。',{exact:false}).isVisible());results.push('归档免密钥查看，明确历史标记，零新模型请求');
 const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'导出验证记录',exact:true}).click();const download=await downloadEvent;const payload=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(payload.result.runId,'3df25a1b-21bd-4e99-b562-8731fe2fe265');assert.equal(payload.result.archive.kind,'verified-historical-run');assert.equal(payload.result.model.elapsedMs,1955);results.push('导出保留原运行ID、原耗时与归档声明');
 await page.getByRole('heading',{name:/模型辅助解释/}).evaluate(el=>el.parentElement.scrollIntoView({block:'center'}));await page.screenshot({path:'artifacts/08-verified-archive.png'});
 await page.getByRole('button',{name:'继续比较',exact:true}).click();await page.getByRole('button',{name:/用 70%/}).click();await page.getByRole('heading',{name:'未通过当前阈值'}).waitFor();assert.equal(await page.getByLabel('历史归档说明').count(),0);assert.equal(calls,1);assert.equal(await page.getByRole('heading',{name:/模型辅助解释/}).count(),0);results.push('新验证清除归档及旧AI正文，不沿用历史成功状态');
 await writeFile('artifacts/archive-ui-qa.json',JSON.stringify({date:'2026-10-22',results,passed:3,modelCallsWhileViewingArchive:0},null,2));results.forEach(s=>console.log('PASS',s));
}finally{await b.close();}
