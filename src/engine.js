import { DATA } from './data.js';
export const pct=(a,b)=>b===0?null:(a/b-1)*100;
export function metrics(){
 const a=DATA.annual[2024],b=DATA.annual[2023],delta=a.profit-b.profit;
 return {revenueGrowth:pct(a.revenue,b.revenue),profitGrowth:pct(a.profit,b.profit),recurringGrowth:pct(a.recurring,b.recurring),cashGrowth:pct(a.cashflow,b.cashflow),profitDelta:delta,recurringDelta:a.recurring-b.recurring,nonrecurringDelta:(a.profit-a.recurring)-(b.profit-b.recurring),contribution:(a.recurring-b.recurring)/delta*100,cashCoverage:a.cashflow/a.profit,recurringShare:a.recurring/a.profit*100,q4RecurringShare:DATA.quarters[3].recurring/DATA.quarters[3].profit*100};
}
export function classify(input=''){
 if(/买入|卖出|加仓|仓位|稳赚|保证收益|目标价|内幕|操纵/.test(input))return 'boundary';
 if(/估值|市盈率|股价|便宜|PE\b/i.test(input))return 'valuation';
 if(/现金流|现金转换/.test(input)&&!/主营|盈利/.test(input))return 'cashflow';
 return 'earnings';
}
export function validateScope(input,period){
 if(typeof input!=='string'||input.trim().length<4)return '请先写下至少 4 个字的投资命题。';
 if(input.length>1000)return '命题请控制在 1000 字以内。';
 if(!/美的|000333/.test(input))return '请在命题中明确研究对象为美的集团（000333），避免将同一证据包用于其他公司。';
 if(/未改善|没有改善|并未改善|未增长|没有增长|利润下降|盈利下降|利润下滑|盈利下滑|不来自|并非来自/.test(input))return '当前模板需要先确认命题方向；请将要检验的正向假设明确写出，再用反证检验，避免系统静默反转原意。';
 if(period!=='2024')return '当前证据包仅覆盖 2024 年报，其他期间需要新增原始材料。';
 const codes=input.match(/\b\d{6}\b/g)||[];
 if(codes.some(c=>c!=='000333')||/茅台|宁德|格力|比亚迪|海尔|特斯拉|腾讯|苹果|同花顺|贵州|招商/.test(input))return '当前证据包属于美的集团，不能用于验证其他公司的命题。';
 const years=input.match(/20\d{2}/g)||[];
 if(years.some(y=>y!=='2024'&&y!=='2023'))return '命题包含证据包以外的年份，请修订为 2024 年相对 2023 年。';
 if(/最新|现在|当前|今年|明年|未来|最近|实时/.test(input))return '历史证据包无法验证当前或未来判断，请明确使用 2024 年回溯口径。';
 if(!/盈利|利润|主营|扣非|现金流|现金转换|估值|市盈率|股价|便宜|PE\b/i.test(input)&&classify(input)!=='boundary')return '命题超出当前三类模板，请选择盈利归因、现金流质量或估值验证。';
 return null;
}
export function plan(input,threshold=50,period='2024'){
 const type=classify(input),error=validateScope(input,period);
 return {type,error,input,threshold,revised:type==='cashflow'?'美的集团 2024 年经营现金流为正，且覆盖当年归母净利润；季度表现是否一致需单独验证。':type==='valuation'?'美的集团 2024 年相对 2023 年估值回落，且盈利基本面未恶化；需补齐可比时点的估值与股本口径。':`美的集团 2024 年归母净利润同比增长，扣非归母净利润增量占归母净利润增量至少 ${threshold}%；以扣非作为经常性盈利代理，不直接等同于主营业务。`,questions:type==='cashflow'?[['现金流是否改善？','核对年度经营现金流及同比'],['盈利是否变现？','计算经营现金流 / 归母净利润'],['改善是否持续？','核对季度分布，寻找季节性解释'],['是否受营运资本驱动？','需要现金流附注与应收存货明细']]:type==='valuation'?[['估值真的回落了吗？','需要可比时点 PE / PB 与股本口径'],['盈利是否恶化？','比较归母与扣非利润'],['是否存在口径差异？','区分静态 PE、TTM 与一次性收益'],['什么会改变结论？','补齐估值与预期盈利数据']]:[['盈利确实改善了吗？','归母与扣非净利润同比交叉检查'],['改善来自经常性盈利吗？','拆分利润增量，检验贡献阈值'],['现金流支持利润吗？','核对经营现金流与季度分布'],['能否归因到主营业务？','检查分部利润桥与非经常项目归因']]};
}
export function analyze({input,threshold=50,period='2024',fault='none'}){
 if(![50,70,100].includes(Number(threshold)))throw new Error('贡献阈值仅支持 50、70 或 100。');
 threshold=Number(threshold);const p=plan(input,threshold,period),m=metrics();
 if(p.error)return {...p,status:'out-of-scope',title:'暂不能验证',summary:p.error,evidence:[],metrics:null,triggers:[]};
 if(p.type==='boundary')return {...p,status:'boundary',title:'超出研究边界',summary:'可以验证公开信息与论据，但不提供个性化买卖、仓位、保证收益或内幕交易建议。请改写为可验证的财务命题。',evidence:[],metrics:null,triggers:[]};
 const base=[
 {id:'E1',stance:'support',title:'盈利增长得到两种利润口径支持',question:0,source:'S1',group:DATA.sourceGroup,fact:'2024 / 2023 归母净利润：38,537,237 / 33,719,935 千元；扣非归母：35,741,418 / 32,974,908 千元。',reading:`归母同比 +${m.profitGrowth.toFixed(2)}%，扣非同比 +${m.recurringGrowth.toFixed(2)}%；确认盈利增长，尚不能直接确认主营归因。`,formula:'(本年利润 ÷ 上年利润 − 1) × 100%',strength:'直接披露 + 可复算',locator:'第 4 页 · 近三年主要会计数据'},
 {id:'E2',stance:m.contribution>=threshold?'support':'oppose',title:'经常性盈利贡献了多少增量？',question:1,source:'S1',group:DATA.sourceGroup,fact:`归母增量 ${(m.profitDelta/100000).toFixed(2)} 亿元；扣非增量 ${(m.recurringDelta/100000).toFixed(2)} 亿元。`,reading:`扣非增量占比 ${m.contribution.toFixed(2)}%，${m.contribution>=threshold?'达到':'未达到'}你确认的 ${threshold}% 阈值。这是经常性盈利代理，非业务分部利润归因。`,formula:'(35,741,418 − 32,974,908) ÷ (38,537,237 − 33,719,935) × 100%',strength:'规则计算',locator:'第 4 页 · 年度利润两种口径'},
 {id:'E3',stance:'support',title:'全年现金流覆盖利润',question:2,source:'S1',group:DATA.sourceGroup,fact:'2024 年经营现金流 60,511,572 千元，2023 年 57,902,611 千元。',reading:`同比 +${m.cashGrowth.toFixed(2)}%，为当年归母净利润的 ${m.cashCoverage.toFixed(2)} 倍；支持全年现金转换，不能据此证明每个季度稳定。`,formula:'60,511,572 ÷ 38,537,237',strength:'直接披露 + 可复算',locator:'第 4 页 · 近三年主要会计数据'},
 {id:'E4',stance:'oppose',title:'非经常性损益对增量贡献不可忽略',question:1,source:'S1',group:DATA.sourceGroup,fact:`归母与扣非差额：2024 年 ${((38537237-35741418)/100000).toFixed(2)} 亿元，2023 年 ${((33719935-32974908)/100000).toFixed(2)} 亿元。`,reading:`该差额的增加贡献了归母利润增量的 ${(100-m.contribution).toFixed(2)}%。削弱“增长全部来自主营”的强表述；它与 E2 是同一组数据的互补拆分，不是独立信源。`,formula:'[(归母24 − 扣非24) − (归母23 − 扣非23)] ÷ 归母增量',strength:'反向检验',locator:'第 4 页 · 年度利润两种口径'},
 {id:'E5',stance:'oppose',title:'全年改善不能外推为季度持续改善',question:2,source:'S1',group:DATA.sourceGroup,fact:'2024 Q4 经营现金流 247,891 千元；归母净利润 6,838,123 千元。',reading:'Q4 经营现金流约 2.48 亿元，低于该季归母利润。反对“每季均有充分现金支撑”的延伸判断；缺少去年同期与营运资本解释，不能认定基本面恶化。',formula:'247,891 ÷ 100,000 = 2.47891 亿元',strength:'时间粒度冲突',locator:'第 4 页 · 分季度主要会计数据'},
 {id:'E6',stance:'unknown',title:'“扣非”不能直接等同于“主营”',question:3,source:'S2',group:DATA.sourceGroup,fact:'已结构化证据包没有分部利润增量、投资收益与汇兑等完整利润桥。',reading:'没有分部利润桥就无法证明具体主营板块贡献。证据缺口限制结论强度，不能因为扣非增长就补写主营因果。',formula:'需要：分部经营利润桥 + 非经常性损益明细 + 合并范围变化',strength:'明确缺口',locator:'全文财务附注待提取，当前无已核验结论'}];
 let evidence=base;
 if(p.type==='cashflow')evidence=[base[2],base[4],{...base[5],id:'E7',title:'营运资本对现金流的贡献尚未分离',reading:'现金流高于利润，可能包含应付款或存货变化；需要现金流补充资料，不能自动等同于盈利可持续。'}];
 if(p.type==='valuation')evidence=[base[0],{...base[5],id:'E8',title:'缺少可比时点的估值数据',reading:'未接入行情、股本和估值时间序列，无法确认估值回落；不生成 PE、股价或买卖结论。'}];
 const partial=fault==='source-timeout';
 if(partial)evidence=evidence.filter(e=>e.stance==='unknown').concat({id:'E0',stance:'unknown',title:'结构化财报读取超时',source:null,reading:'本次运行未读取财务数值，停止计算并降级为无法验证。原证据包仍可在资料库查看。',fact:'测试注入：超时。未调用外部财报 API。',strength:'异常记录'});
 const status=partial||p.type==='valuation'?'insufficient':p.type==='cashflow'?'qualified':m.contribution>=threshold?'qualified':'not-supported';
 return {...p,metrics:partial?null:m,evidence,status,fault,title:status==='insufficient'?'证据不足，保留判断':status==='not-supported'?'未通过当前阈值':'有条件支持，保留归因',summary:partial?'结构化财报读取失败，当前不产出数值结论。可重试后重新验证。':p.type==='valuation'?'财报支持盈利增长，但没有估值数据，不能验证“估值回落且基本面未恶化”这个完整命题。':p.type==='cashflow'?'全年经营现金流为正并覆盖归母净利润；Q4 表现提示季度差异，持续性和营运资本驱动尚待验证。':`扣非利润增量贡献 ${m.contribution.toFixed(2)}%，${m.contribution>=threshold?'达到':'未达到'} ${threshold}% 阈值；非经常性损益增量贡献 ${(100-m.contribution).toFixed(2)}%。能验证经常性盈利改善，尚不能完成主营业务因果归因。`,conflict:partial?'本次财报读取失败，尚不能完成事实与口径冲突核对。不会沿用历史运行的数值或定性结论；恢复读取后应重新验证。':p.type==='valuation'?'估值与财务是不同维度。盈利增长不能替代估值回落的验证；缺少同口径估值序列时，保留完整命题为无法验证。':p.type==='cashflow'?'全年与单季现金转换可以不同，先核对期间与季节性，再判断持续性。没有可比同期与营运资本解释，不将 Q4 偏低直接写成同比恶化。':'冲突按命题强度与时间粒度解释：全年现金覆盖良好，与 Q4 现金转换偏低可以同时成立；归母和扣非增速不同，源于统计口径，不能平均后抹平。所有财务证据同源，不按证据条数投票。',triggers:partial?['恢复财报读取后，重新计算与核对证据，才可能改变当前“证据不足”的状态。','补充原始材料与完整业务利润桥，之后重新评估归因。']:p.type==='valuation'?['补齐两个可比时点的 PE / PB、股本与盈利口径后，才能判断估值是否回落。','若扣非盈利或现金转换恶化，重新评估“基本面未恶化”。']:[`若补充或重述后扣非增量占比低于 ${threshold}%，撤回对应阈值下的支持。`,'若补充利润桥表明主要增量来自非主营因素，则不支持原命题中的“主营驱动”主张。','若同口径季度同比显示现金转换持续恶化，下调盈利质量判断。'],provenance:{independentGroups:1,documents:2,latestPeriod:'2024-12-31',asOf:'2025-03-29',verified:DATA.verified},trace:partial?['scope.checked','claim.revised','disclosure.snapshot.timeout','conclusion.withheld']:['scope.checked','claim.revised','disclosure.snapshot.loaded','metrics.recomputed','counterevidence.checked','citations.attached'],engine:'deterministic',generatedAt:new Date().toISOString()};
}
