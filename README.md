# 证研 · 投资命题与多证据验证

把投资直觉变成可检验命题：澄清口径、组织支持 / 反对 / 未知证据、展示原始材料与计算、保留结论反转条件，再保存为研究任务。

这是同花顺 AI 产品经理笔试的可运行原型，以**美的集团 2024 年盈利归因**打通完整链路。

## 运行与提交入口

- 站点：https://zhengyan-investment-lab.swoonymochi513.chatgpt.site （访问权限以部署返回状态与提交清单为准）
- 在线源码包：站点 `/source.zip`；本地源码为本目录。
- 公开源码仓库：[ying1221/zhengyan-investment-lab](https://github.com/ying1221/zhengyan-investment-lab)。
- 演示视频与完整提交包：[v1.0.0 发布附件](https://github.com/ying1221/zhengyan-investment-lab/releases/tag/v1.0.0)。
- 部署状态与演示说明：见 [提交清单](docs/提交清单.md)。
- 先看 [快速上手与答辩](docs/快速上手与答辩.md)，再看 [产品设计与取舍](docs/产品设计与取舍.md)。

## 60 秒体验

默认命题 → 拆解 → 确认 50% 阈值 → 验证 → 查看反对证据 E4 的公式与原始 PDF → 继续比较 70% 阈值 → 保存研究任务。

免填密钥查看真实 AI 输出：[已核验历史案例](https://zhengyan-investment-lab.swoonymochi513.chatgpt.site/?example=verified)。该记录来自 2026-10-22 17:41 的真实调用，界面明确标记归档；查看时不产生新调用。

亮点：同一证据下，扣非增量贡献 **57.43%**，达到 50% 但未达到 70%；同时保留“扣非不等于主营”的归因缺口。模型不负责生成财务数值。

## 本地启动

需要 Node.js 22 或更新版本。应用运行与构建不依赖第三方运行时库。

```sh
npm run dev
# http://127.0.0.1:4173
```

修改后重启本地服务。构建与检查：

```sh
npm run build
npm test
npm run validate
```

浏览器 QA 需要 `npm ci` 和 `npx playwright install chromium --only-shell`；也可通过 `CHROMIUM_PATH` 指定已安装 Chromium 路径。

```sh
node scripts/browser-qa.mjs
```

## 用户、设计与 AI 角色

目标用户是已有投资假设、希望查找反证与原始依据的个人研究者 / 初级投研人员。产品将模糊判断改写为带对象、期间与阈值的可验证命题，由用户确认后再计算。

确定性规则负责：范围、模板拆解、指标复算、同源标记、证据立场、阈值判定与异常降级。可选 DeepSeek 负责：受限证据上的解释、后续子问题与追问。模型输出经过结构和引用 ID 校验，仍需人工核对语义。

**未配置密钥时使用规则验证。** 2026-10-22 用户已在公开站点自行配置并提供真实 DeepSeek 成功截图：HTTP 200、complete、约 2 秒。本次原始 JSON、报告与模型解释已核对：11 项派生指标、E1/E2/E4/E5/E6 引用一致。当前只验证这一条实际案例。自动化替身测试与真实用户实测分别记录。

启用方式：产品设置中输入 DeepSeek Key 并勾选模型辅助；密钥只驻留当前页内存、通过本站后端转发至固定官方地址，不落到任务 / 导出文件。或在服务端环境设置 `DEEPSEEK_API_KEY` 和可选 `DEEPSEEK_MODEL`（默认 `deepseek-flash`）。程序不会自动读取 `.env`。不要提交真实密钥。

## 真实数据与证据边界

原始材料为美的集团发布的 [2024 年年度报告摘要（第 4 页）](https://pdf.dfcfw.com/pdf/H2_AN202503281648793871_1.pdf#page=4) 与 [年报全文分发入口](https://asia.tools.euroland.com/tools/Pressreleases/GetPressRelease/?ID=7370767&companycode=cn-000333&lang=zh-CN)。数值来自摘要，全文用于后续核查入口，未完成全文自动解析。

披露日期 2025-03-29，研究期间 2024 年，核验日期 2026-10-22。原始单位人民币千元。`src/data.js` 是人工核对结构化的历史快照，`src/engine.js` 复算指标；不是实时接口。

两份材料只有 **1 个同源组**，多条财务证据不等于独立多源印证。数据完整性通过四个季度与年度严格加总核验。未接入扶摇 / iFinD 授权服务，不伪称调用。

## 异常、合规与未做事项

设置中可明确注入财报读取超时 / 模型超时：前者不产出数值结论，后者保留规则结果。API 验证请求格式、跨站来源、模型结构与引用 ID。模型真实错误与注入测试分别记录。

当前只覆盖一家公司的一个报告期与三类研究模板。其他公司、期间、实时和部分否定命题会提示无法验证；估值模板明确缺少行情数据。不提供个性化买卖、仓位或收益承诺。关键词检查只是原型护栏，不是完整合规系统。

任务与历史保存在浏览器 localStorage，无云端账户 / 协作 / 定时监控。没有自动交易、研报权限绕过、任意 PDF 解析或分部主营因果证明。公开部署前须评估模型额度、服务端密钥的调用权限与速率限制。

## 目录

`src/`：界面、财报快照与规则引擎；`worker/`：HTTP API 与模型调用；`scripts/`：构建、预览、QA、演示录制；`tests/`：业务与 API 测试；`docs/`：产品、答辩、AI 使用记录与提交材料。

构建生成 `dist/server/index.js`，包含 UI 与 Worker。采用 Sites Worker ESM 托管，构建命令为 `node scripts/build.mjs`，不使用遗留的 bash starter 构建。

测试方法、实际结果与限制见 [测试说明](docs/测试说明.md)；AI 的开发使用与运行时验证分开见 [AI 使用与验证记录](docs/AI使用与验证记录.md)。
