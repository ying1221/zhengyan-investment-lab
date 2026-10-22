"""Package the complete project, demo and verification evidence (under 30 MB).

Run `npm run build` first. This script never includes Git history, dependencies,
local credentials or publication helper scripts.
"""
from pathlib import Path
import hashlib
import io
import json
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT.parent / '证研-完整交付包.zip'
PREFIX = '证研完整交付包/'
ARTIFACTS = ROOT / 'artifacts'

guide = '''# 证研 · 完整项目材料

本压缩包包含可运行源码、演示视频、设计说明、AI 使用与验证记录、测试说明和原始导出，可作为一个附件直接提交。

建议阅读顺序：

1. 播放 `证研-产品演示.mp4`，60–180 秒，了解完整流程。
2. 阅读 `README.md` 和 `docs/产品设计与取舍.md`。
3. 源码在 `项目源码/zhengyan/`；安装 Node.js 22+ 后，在该目录运行 `npm run dev`，打开 http://127.0.0.1:4173。常规运行无第三方依赖，浏览器自动化检查另需安装开发依赖。
4. 核对 `真实模型调用/` 的原始报告、JSON 与校验记录，以及 `docs/真实调用逐项核验.md`。
5. 测试方法、异常注入与边界见 `docs/测试说明.md`；截图和检查结果在 `验证截图与记录/`。

在线产品：https://zhengyan-investment-lab.swoonymochi513.chatgpt.site
公开源码：https://github.com/ying1221/zhengyan-investment-lab
真实模型归档：https://zhengyan-investment-lab.swoonymochi513.chatgpt.site/?example=verified

联网可体验部署产品；解压后的源码可独立运行规则验证和已归档案例。新模型调用需要在设置中自行配置 DeepSeek Key，原始财报链接需要联网。压缩包不包含密钥。

能力范围：当前只覆盖美的集团 2024 年历史财报。扣非增量贡献 57.43% 支持修订后的 50% 阈值命题，但不能证明主营业务的因果归因。两份披露属同源；授权行情接口尚未接入。视频中的 AI 段落是明确标记的真实调用历史归档，不是录制时新推理。

`文件校验.json` 列出每个交付文件的大小与 SHA-256，便于核对解压完整性。
'''

entries = {'先看这里.md': guide.encode('utf8')}
for path in [ROOT / 'README.md', *sorted((ROOT / 'docs').glob('*.md'))]:
    entries[path.relative_to(ROOT).as_posix()] = path.read_bytes()
for name in ['证研-产品演示.mp4', '证研-源码.zip']:
    entries[name] = (ARTIFACTS / name).read_bytes()
with zipfile.ZipFile(io.BytesIO(entries['证研-源码.zip'])) as source:
    assert source.testzip() is None
    for info in source.infolist():
        assert not info.filename.startswith('/') and '..' not in Path(info.filename).parts
        entries['项目源码/' + info.filename] = source.read(info)
for name in ['01-workbench.png', '02-result.png', '03-evidence.png', '04-mobile.png',
             '05-public-settings.png', '06-model-diagnostics.png',
             '07-live-model-success.png', '08-verified-archive.png',
             'browser-qa.json', 'model-ui-qa.json', 'archive-ui-qa.json']:
    entries['验证截图与记录/' + name] = (ARTIFACTS / name).read_bytes()
for name in ['真实调用验证记录.json', '真实调用研究报告.md', 'live-run-audit.json']:
    entries['真实模型调用/' + name] = (ARTIFACTS / name).read_bytes()

manifest = [{'file': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            for name, data in sorted(entries.items())]
entries['文件校验.json'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode('utf8')
with zipfile.ZipFile(OUTPUT, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name, data in sorted(entries.items()):
        archive.writestr(PREFIX + name, data)

assert OUTPUT.stat().st_size < 30_000_000, 'Archive exceeds 30 MB'
with zipfile.ZipFile(OUTPUT) as archive:
    assert archive.testzip() is None
    for item in manifest:
        assert hashlib.sha256(archive.read(PREFIX + item['file'])).hexdigest() == item['sha256']
print(json.dumps({'file': OUTPUT.name, 'bytes': OUTPUT.stat().st_size,
                  'MB': round(OUTPUT.stat().st_size / 1_000_000, 2),
                  'entries': len(entries), 'crcAndSha256Verified': True}, ensure_ascii=False))
