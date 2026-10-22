import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const scenes=JSON.parse(await readFile('scripts/scenes.json','utf8'));
const durations=JSON.parse(await readFile('artifacts/audio/durations.json','utf8'));
await mkdir('artifacts/video',{recursive:true});
const dry=process.env.DEMO_DRY_RUN==='1';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,...(!dry?{recordVideo:{dir:'artifacts/video',size:{width:1440,height:960}}}:{})});
const page=await context.newPage();const video=page.video(),log=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const click=async locator=>{await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();if(b)await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await locator.click();};
const center=async selector=>{await page.locator(selector).first().evaluate(el=>el.scrollIntoView({behavior:'smooth',block:'center'}));await pause(700);};
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173');await page.getByRole('button',{name:'2024 年年度报告摘要'}).waitFor();
 await page.evaluate(()=>{const node=document.createElement('div');node.id='record-caption';node.style.cssText='position:fixed;left:225px;right:28px;bottom:18px;padding:17px 24px;background:#203f33f5;color:#fff;border:1px solid #6f8d65;border-radius:11px;z-index:1000;pointer-events:none;box-shadow:0 8px 40px #18362330;font-family:Microsoft YaHei,sans-serif';document.body.append(node);const cursor=document.createElement('div');cursor.style.cssText='position:fixed;width:28px;height:28px;border:2px solid #bc9859;background:#d5b87e30;border-radius:50%;z-index:9999;pointer-events:none;transform:translate(-50%,-50%)';document.body.append(cursor);document.addEventListener('mousemove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';});});
 const beginning=Date.now();
 for(let i=0;i<scenes.length;i++){
  const sceneStart=Date.now();log.push({scene:i,start:(sceneStart-beginning)/1000,title:scenes[i].title});
  await page.evaluate(({s,i,total})=>{const node=document.querySelector('#record-caption');node.replaceChildren();const small=document.createElement('div');small.style.cssText='color:#c6d6b6;font-size:12px;letter-spacing:2px;margin-bottom:4px';small.textContent=`证研 · 产品演示 ${String(i+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;const title=document.createElement('div');title.style.cssText='font-size:23px;font-weight:600';title.textContent=s.title;const desc=document.createElement('div');desc.style.cssText='font-size:14px;color:#dce6d1;margin-top:3px';desc.textContent=s.caption;node.append(small,title,desc);},{s:scenes[i],i,total:scenes.length});
  if(i===0){await page.mouse.move(670,370,{steps:20});}
  if(i===1){await click(page.getByRole('button',{name:/拆解命题/}));await page.getByRole('button',{name:/确认口径/}).waitFor();await center('.plan-panel');}
  if(i===2){await click(page.getByRole('button',{name:/确认口径/}));await page.getByRole('heading',{name:'有条件支持，保留归因'}).waitFor();await page.locator('.result').evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'start'}));await pause(600);}
  if(i===3){await click(page.getByRole('tab',{name:/反对/}));await click(page.getByRole('button',{name:'证据详情与原文 ↗'}).first());await page.getByRole('dialog').waitFor();await page.mouse.move(830,680,{steps:15});}
  if(i===4){
   await page.keyboard.press('Escape');await click(page.getByRole('tab',{name:/无法验证/}));await center('.evidence-list');
   if(!dry)await pause(3500);await center('.conflict');if(!dry)await pause(3800);await center('.triggers');
   await page.screenshot({path:'artifacts/video/05-unknown-and-reversal.png'});
  }
  if(i===5){await click(page.getByRole('button',{name:'查看真实 AI 案例',exact:true}));await page.getByRole('heading',{name:'历史记录：DeepSeek 调用成功'}).waitFor();await page.getByRole('heading',{name:/模型辅助解释/}).evaluate(el=>el.parentElement.scrollIntoView({behavior:'smooth',block:'center'}));await pause(700);}
  if(i===6){await click(page.getByRole('button',{name:'继续比较'}));if(!dry)await pause(2200);await click(page.getByRole('button',{name:/用 70%/}));await page.getByRole('heading',{name:'未通过当前阈值'}).waitFor();await page.locator('.result').evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'start'}));}
  if(i===7){
   for(const [button,name] of [['导出研究报告','demo-report.md'],['导出验证记录','demo-verification.json']]){
    const waiting=page.waitForEvent('download');await click(page.getByRole('button',{name:button,exact:true}));const download=await waiting;await download.saveAs('artifacts/video/'+name);
   }
   await click(page.getByRole('button',{name:'保存为研究任务'}));await click(page.getByRole('button',{name:/研究任务/}).first());await page.getByText('待补充证据',{exact:true}).waitFor();await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
  }
  if(i===8){await click(page.getByRole('button',{name:'打开验证快照'}));await page.evaluate(()=>window.scrollTo(0,0));await click(page.getByRole('button',{name:'设置',exact:true}));await page.locator('#fault').selectOption('source-timeout');await click(page.getByRole('button',{name:'应用设置'}));await click(page.getByRole('button',{name:'修订命题后重验'}));await click(page.getByRole('button',{name:/确认口径/}));await page.getByRole('heading',{name:'证据不足，保留判断'}).waitFor();await page.locator('.result').evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'start'}));await page.screenshot({path:'artifacts/video/09-timeout.png'});}
  if(i===9){
   await click(page.getByRole('button',{name:'设置',exact:true}));await page.locator('#fault').selectOption('none');await click(page.getByRole('button',{name:'应用设置'}));
   await page.locator('#thesis').fill('美的集团 2024 年该买多少仓位，能保证收益吗？');await click(page.getByRole('button',{name:/拆解命题/}));await page.getByRole('heading',{name:'超出研究边界'}).waitFor();await page.locator('.result').evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'center'}));await pause(700);await page.screenshot({path:'artifacts/video/10-compliance.png'});
  }
  const remaining=(durations[i]+.8)*1000-(Date.now()-sceneStart);if(!dry&&remaining>0)await pause(remaining);
  console.log(`${dry?'Checked':'Recorded'} scene ${i+1}/${scenes.length}`);
 }
 if(errors.length)throw new Error(errors.join(' | '));
 await writeFile(dry?'artifacts/video/demo-preflight.json':'artifacts/video/timeline.json',JSON.stringify({scenes:log,pageErrors:errors,dryRun:dry},null,2));
}finally{await context.close();if(video)await video.saveAs('artifacts/video/证研-实际操作.webm');await browser.close();}
