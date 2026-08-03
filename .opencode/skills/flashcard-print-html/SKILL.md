---
name: flashcard-print-html
description: 闪卡打印版 HTML 生成工作流。输入闪卡数据（data/<base>.js 或 .json），产出可直接打印的闪卡 HTML：儿童闪卡风格、B5 横版一卡一页（250×176mm）、正面=完整图片+圆角、背面=大 keyword+角落小字、双面打印长边翻转即成品无需裁剪、file:// 离线可用。Triggers: 闪卡打印、打印版、打印闪卡、flashcard print、card.html、B5、一卡一页、双面打印、儿童闪卡、testdata_card、横版闪卡。
---

# 闪卡打印版 HTML 生成工作流（Flashcard Print HTML）

将闪卡数据（JS 或 JSON）转换为**可直接打印的闪卡 HTML**。核心特征：B5 横版、一卡一页、双面打印长边翻转后即为成品，**无需裁剪**。

## 输入 / 输出

```
输入：data/<base>.js    （或 data/<base>.json；schema 见项目 README §4）
输出：<base>_card.html  （如 testdata_card.html，浏览器打开 Ctrl+P 直接打印）
```

其中 `<base>` = 数据文件名去掉扩展名（`data/testdata.js` → `<base>` = `testdata`）。

## 定稿设计规范（本项目已确认，执行时直接套用，勿再改版式）

### 页面规格

| 项 | 定稿值 |
|---|---|
| 纸张 | **B5 横版 250×176mm**，`@page{size:250mm 176mm; margin:0}` |
| 卡片 | 一卡一页，满铺整页，无裁切线，**打印完即成品** |
| 页序 | 每张卡 = 正面页 + 背面页相邻（正1背1 正2背2 …），双面打印长边翻转自动配对 |
| 打印选项 | 双面 / 仅正面 / 仅背面（radio + body class `print-front`/`print-back` 控制隐藏） |
| 页码角标 | 正面无任何附加内容；背面右下角保留「韵部 + 序号 i/N」 |

### 正面（图片页）

- 图片 **contain 完整展示居中**（横图竖页 cover 会裁切，勿用），`border-radius:8mm`，无边框无内边距
- 无图/裂图：整页渐变占位 + 大 keyword + "暂无图片"

### 背面（信息页，四区绝对定位）

| 区域 | 内容 | 定稿样式 |
|---|---|---|
| keyword | 大号居中偏上 | **140pt**，`top:40%`（translateY(-50%)），**黑色**（所有卡片统一） |
| 中下侧 | source（出处）+ analysis（释义） | 11pt / 10pt **黑色**，`bottom:18mm` 居中 |
| 左下角 | logic（位置逻辑） | 8.5pt **黑色**，`left:10mm; bottom:8mm` |
| 右下角 | category（韵部）+ 序号 | 9pt **黑色**，`right:10mm; bottom:8mm` |

> 最小可读字号 **≥8.5pt**（用户反馈过 7.5pt 打出来看不清）。

### 屏幕预览

- 3D 点击翻面（`.flip-card.flipped` 旋转 180°），卡片比例同 B5 横版（375×264px）
- 多图卡片正面顶部圆点选择，**选图同步更新打印页正面**
- 预览与打印共用背面 DOM 结构（`.fb` 四区），字号在 `@media print` 内覆盖

## 需求演进记录（2026-08-02 实测定稿，供理解用户偏好）

| 轮次 | 用户要求 | 版式变化 | 经验 |
|---|---|---|---|
| 1 | "参照儿童闪卡、可直接打印" | A4 竖版网格 6 卡/页 + 虚线裁切线 | 用户实际要「直接打印成品」，网格裁剪版整版被推翻 |
| 2 | "打印到 B5 纸，不需裁剪" | 改 B5 竖版一卡一页 | 动手前先确认：纸张规格/方向/是否裁剪 |
| 3 | "卡片横版、图片不要边距、不要页序、完整图片" | 改 B5 横版 250×176mm，正面纯图 | 「完整图片」= contain 居中（cover 会裁切）；正面不允许任何附加元素 |
| 4 | "keyword 放大偏上，其他信息缩到极致，分区摆放" | 背面四区绝对定位（kw/中下/左下/右下） | 四区布局自此稳定，沿用至今 |
| 5 | "keyword 继续放大，统一颜色" | 60→84pt；多彩轮换→统一深蓝 | 用户偏好大字 + 全卡同色（不做花哨轮换） |
| 6 | "其他字体放大点，打出来看不清" | 小字 7.5pt→8.5~11pt | 打印最小可读字号 ≥8.5pt |
| 7 | "keyword 继续放大，往下居中一点" | 84→104pt→120pt，top 34%→40% | 位置/字号按用户逐轮微调，每轮只动一处 |
| 8 | "keyword 继续放大；全部文字黑色" | 120→140pt；全文字黑色（定稿） | 最终偏好：高对比纯黑（省墨、清晰）；主标题 140pt 为最终值 |

**用户偏好总结（做版式时直接套用）**：
- 卡片 = 打印出来直接是成品，**永远不要设计需要裁剪的版式**
- 正面：纯图片（contain 完整 + 圆角），不附加任何文字/角标
- 背面：keyword 大字（140pt 黑）为主，其余信息一律小字（8.5~11pt）放角落，主次分明
- 颜色：全部纯黑，不要彩色/淡色装饰文字
- 迭代节奏：每轮只接受一处明确改动，改完立即实测验证再继续

## 技术要点

- 纯内联 CSS/JS、无外部依赖（不引 CDN）、`<meta charset="utf-8">`、`file://` 双击可用
- 打印隐藏：`.topbar,.preview,.tip{display:none !important}`；`.sheet` 屏幕 `display:none`、打印 `display:block`
- **分页用 `.sheet-page:not(:first-child){page-break-before:always; break-before:page}`**——不要用 break-after，否则末页后会产生空白页
- `*{-webkit-print-color-adjust:exact; print-color-adjust:exact}` 保证背景色输出
- 页面/卡片尺寸全部用 mm 精确值，与 `@page` 保持一致
- UI 提示文案必须包含：纸张 B5 横向、双面打印长边翻转、勾选背景图形；ISO B5 176×250 vs JIS B5 182×257（打印机无 ISO 选项时勾「适应纸张」）

## 验证清单（执行完成后自查）

1. 浏览器打开无控制台错误；全部卡片渲染、图片 0 裂图（`naturalWidth === 0` 检查）
2. `page.pdf({printBackground:true, preferCSSPageSize:true})`：
   - MediaBox = `0 0 708.96 498.96`（B5 横版 250×176mm 精确值）
   - 页数 = 卡片数×2（双面）/ 卡片数（仅正面/仅背面），**无多余空白页**
3. `emulateMedia('print')` 后检查计算样式：keyword 186.7px（140pt）、各区域坐标无重叠、全部文字 `rgb(0,0,0)`
4. 交互：点击翻面、多图圆点选图 → 打印页正面图同步
5. 若当前模型不支持图片输入（截图无法目视，multimodal-looker 同模型也受限）：改走 **DOM 断言路线**，功能等价——打印模式下检查 0 占位符（`.sheet-page.front .ph` 计数 = 0）、四区坐标不重叠且不越界、全部可见文字 `rgb(0,0,0)`（排除容器元素），配合第 2 条 PDF 正则核对

## 已知坑与对策（务必遵守）

| 坑 | 现象 | 对策 |
|---|---|---|
| Playwright MCP 拦截 `file://` | 无法直接打开本地文件 | 本地起静态服务验证：`python -m http.server 8765`（相对路径行为与 file:// 一致） |
| `emulateMedia('print')` 时序 | 偶发取到屏幕样式（字号/坐标不对） | 分步执行：先 navigate，再在 run_code 中 `emulateMedia` + `waitForTimeout(600)` 后取值；或直接用 `page.pdf` 验证 |
| `page.pdf` 的 `format` 不支持 `'B5'` | 报 Unknown paper format | 用 `preferCSSPageSize:true`，由 CSS `@page` 决定尺寸 |
| 尾部空白页 | break-after 强制分页后无内容 | 改用 `:not(:first-child){break-before:page}` |
| 横图竖页裁切 | object-fit:cover 上下裁掉约一半 | 「完整图片」需求一律 `object-fit:contain` + flex 居中 |
| 打印字号过小 | 7.5pt 以下打印模糊 | 最小 8.5pt；keyword 主标题 100pt+（定稿 140pt） |
| 覆盖已存在文件失败 | write 工具报 "File already exists" | 先 Read 目标文件再 Write |
| 纸张规格不匹配 | 打印对话框无 ISO B5 | UI 提示勾选「适应纸张」（JIS B5 182×257） |
| 三处不同步 | 交付物 HTML 改了，模板/规范文档没改 | 每次版式变更后同步三处：`<base>_card.html` + `reference/flashcard_print.html` + SKILL.md 定稿表 |
| 设计裁剪版式 | 用户需求"直接打印成品" | 永远一卡一页满铺，不做网格+裁切线方案 |
| 屏幕模式下测打印布局 | `.sheet` 屏幕 `display:none`，`getBoundingClientRect()` 全 0，溢出/重叠断言"空转全过"（假阳性） | 布局断言必须先 `emulateMedia('print')` + `waitForTimeout(600)`，测完再恢复 `screen` |
| 控制台 favicon 404 | 浏览器默认请求 `favicon.ico` 报 404，误判为页面错误 | 忽略 favicon 404；无其他报错即通过 |
| PDF 二进制无法肉眼核对 | 页数/MediaBox 无法直接看 | run_code 内 `buf.toString('latin1')` + 正则：页数 `/\/Type \/Page[^s]/g`（排除 `/Pages`），MediaBox `/\/MediaBox \[([^\]]+)\]/` |
| loadError 显示判断写反 | 未显示时 `style.display` 是空字符串而非 `'none'`，`!== 'none'` 恒 true | 数据加载成功判据 = 卡片渲染数量 > 0，别用 loadError 显隐 |
| 背面朝上时点圆点被拦截 | 3D 翻转后 back face 覆盖 front，点击落在背面板（还会把卡翻回正面），选图不同步，误判为 bug | 验证选图同步前，先点卡片翻回正面再点圆点 |
| 非黑文字统计误报 | 背面板容器本身继承 body `--ink` 色，每页恰好 1 个非黑元素 | 非黑数 = 页数（容器）即全部文字为黑；或只统计 `.sheet-page.back` 的文本元素（.b-kw/.b-src/.b-an/.b-logic/.b-badge） |
| keyword 溢出检查失效 | `.b-kw` 是满宽元素（`left:0;right:0`），元素 rect 宽度恒等于页面宽 | 按文本实际渲染宽判断：字数 × 140pt（≈49.4mm/字）< 250mm；实测 4 字词「山重水复」746.8px 不溢出 |
| 模型不支持图片输入 | 截图无法目视，视觉代理（multimodal-looker）用同模型同样看不到 | 放弃视觉路径，走 DOM 断言 + PDF 正则（见验证清单第 5 条），结论等价 |
| vm 沙箱读 `<base>.js` 拿不到数据 | `const data_260802` 是词法声明，不挂到 context 对象，`ctx.data_260802` 为 undefined | 先 `vm.runInContext(code, ctx)`，再 `vm.runInContext('data_260802', ctx)` 二次读取 |

## 使用步骤

1. 读取数据文件，确认字段（image/keyword/logic/source/analysis/category），确认 `<base>`
2. 复制 `reference/flashcard_print.html` 到输出位置，重命名为 `<base>_card.html`
3. 全局替换占位符：
   - `__BASE__.js` → `<base>.js`（`<script src="data/<base>.js">`、`typeof <base>`、`var CARDS = <base>`、loadError 文案）
   - 按项目自定义标题/logo 文案
4. 按「验证清单」逐项执行

## 参考模板

- `reference/flashcard_print.html` — 以 `__BASE__` 占位符泛化的模板（当前定稿版 testdata_card.html 的泛化副本）
- `reference/USAGE.md` — 可直接复制发给 AI 的使用提示词（完整版/精简版/改版式/恢复指引）；仅 SKILL.md 自动加载，reference 下文件按需读取
