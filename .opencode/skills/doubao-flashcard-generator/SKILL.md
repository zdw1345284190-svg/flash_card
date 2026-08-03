---
name: doubao-flashcard-generator
description: 闪卡图片生成与数据编辑工作流。输入一个闪卡 JSON 数据文件（如 data260802.json / testdata.json），自动完成：为每张卡生成"图片提示词"→ 通过调试端口 9700 的浏览器（豆包）逐张生成并下载图片到 <base>_images/ 目录 → 产出 <base>.js（含图片提示词 + image 数组）与 <base>.html（展示/编辑/审核工具）。Triggers: 闪卡图片、生成图片、豆包生成、flashcard、卡片配图、data.html、testdata、260802、笠翁对韵、图片提示词。
---

# 闪卡图片生成与数据编辑工作流（Doubao Flashcard Generator）

> **给使用者的提示词模板见 `reference/USAGE.md`**（不随 skill 自动加载，需显式读取；本会话删除后也能找到并复用）。

将闪卡 JSON 数据转换为「含图片 + 可编辑审核」的完整交付集。**核心特征**：所有产出物与输入文件同名（`<base>` 前缀统一）。

## 输入 / 输出

```
输入：data260802.json          （文件名可变，任意路径）
输出：
  ├── <base>_images/           # 生成的图片目录（如 data260802_images/）
  ├── <base>.js                # JS 版数据：含"图片提示词"字段 + image 路径数组（图片已生成填入）
  └── <base>.html              # 展示与编辑工具（增删图片/选默认图/改字段/导出），最终人工审核用
```

其中 `<base>` = 输入文件去掉扩展名的文件名（`data260802.json` → `<base>` = `data260802`）。

## 前置条件

1. 用户已在**调试端口 9700** 的 Chrome 中打开并登录豆包（https://www.doubao.com/chat/...）
2. Node.js 环境可用，Playwright 全局安装于 `%APPDATA%\npm\node_modules`（win 下执行脚本前设置 `$env:NODE_PATH`）
3. 输入 JSON 为 UTF-8 编码的卡片数组，每张卡含字段：`keyword`（关键词）、`source`（出处）、`logic`（位置逻辑）、`analysis`（释义）、`category`（韵部/分组）

## 步骤 1：为每张卡生成「图片提示词」

在卡片对象中加入 `图片提示词` 字段（放在 `image` 之后、`keyword` 之前，保持输出格式与现有 testdata.js 一致）。提示词模板：

```
国风儿童插画：<根据 keyword 与 analysis 描绘的 60~100 字场景>，构图大气留白，色彩明亮清新，扁平卡通风格，圆润可爱线条，适合儿童闪卡横版构图，无文字
```

要点：
- 以 `keyword` 为主题意象，参考 `analysis` 的语义（如"天"→ 高远天空/飞鸟/白云）
- 必须含"适合儿童闪卡横版构图，无文字"后缀（保证横版、无文字渲染）
- 用中文逗号分隔意象，画面要素 4~6 个即可，避免过载

## 步骤 2：豆包批量生成并下载图片

参考脚本：`reference/gen_images.js`（按需调整 `CARDS` 与 `IMG_DIR` 后直接运行）。

```
$env:NODE_PATH = "C:\Users\bruce\AppData\Roaming\npm\node_modules"; node gen_images.js
```

核心流程（脚本已封装）：

1. **连接**：`chromium.connectOverCDP('http://localhost:9700')`，取 `p.url().includes('doubao.com')` 的页面
2. **提交提示词**：先点击 `button` 文本为「图像生成」的按钮（若存在）确保图像模式；编辑器优先 `div.tiptap.ProseMirror`，兜底 `textarea.semi-input-textarea`；点击后 `keyboard.type(prompt)`，回车提交
3. **等待生成**：轮询 `img[src*="rc_gen_image"]` 的 URL 集合，取相对旧集合的新 URL；新 URL 数量连续 8 秒稳定且页面无"正在生成"文本即视为完成（超时 180s）
4. **逐张下载**：对每个新 URL，点击对应缩略图打开编辑面板 → 点击「保存」→ 捕获 `download` 事件 → `saveAs` 到 `<base>_images/<keyword拼音>_<序号>.png`（如 `tian_1.png`、`di_1.png`）；完成后按 Escape 关闭面板
5. **去重校验（重要）**：下载完成后对全部文件算 MD5，若有重复（如两张卡下载到了同一张图），删除重复文件并**重新下载**该卡图片；同时确认每张卡的图片与关键词匹配（可点击该图核对编辑面板中显示的 URL 基名）

已知坑（务必处理）：
- 豆包每轮生成 **1~4 张不等**，不是固定 4 张——以实际检测到的新 URL 为准
- 页面是**虚拟滚动 + 懒加载**（滚动容器 `div.v_list_scroller-BxcoIX`，未加载的 img src 是 `data:image/svg+xml` 占位），检测新图前先滚动到对话底部，或滚动完整页确保图片真实 URL 出现在 DOM
- 检测"新图"可能误收旧图（懒加载导致旧图 URL 重新出现在 DOM）→ 下载后用 MD5 去重兜底
- 点击「保存」时若编辑面板停留的是上一张图，会下载错图 → 下载前核对面板 img 的 URL 基名与目标一致

### 生成频率与会话管理（重要：防封号 / 防会话超限）

豆包对图片生成有**频率限制**与**单会话次数限制**，批量生成前必须规划节奏：

1. **估算会话承载量**：
   - 一个豆包会话可生成的图片次数有限（多次生成后会提示超出对话次数/无法继续生成）
   - 生成前先估算：总卡数 × 期望图片数。若卡片多（如 151 张卡全量配图），必须**分多个会话**完成，不要指望一个会话生成完
2. **控制生成节奏（防封号）**：
   - 每次提交提示词之间加**人为延时**（建议 15~30 秒），不要连续快速提交
   - 每轮生成完成后等待图片完全加载再提交下一轮
   - 单次会话内连续生成达到约 10~15 次后暂停，观察是否出现限流提示（如"生成过于频繁"、"稍后再试"）
   - 检测到限流/超限提示时**立即停止**该会话，不要重试硬冲
3. **切换新会话**：
   - 新会话 = 新建豆包对话（点击"新对话/新建会话"），或打开新的豆包 chat 页面（新 URL），图片生成次数会重置
   - 切换后需重新确认图像生成模式与编辑器可用（同步骤 2 的提交流程）
   - 记录每会话已生成次数与累计进度（如脚本输出日志），便于断点续做
4. **失败续做**：
   - 生成脚本应支持**断点续做**：已成功下载图片的卡跳过，只生成缺图的卡（对比 `<base>_images/` 目录现有文件与目标清单）
   - 中途切换会话后，重跑脚本只需补未完成的卡

实现建议：生成脚本中为 CARDS 维护进度标记（如已下载的 `prefix` 集合），每轮提交前 sleep 15~30s；遇到"正在生成"长时间无新图或限流文案时抛错终止，由执行者决定切换会话后续跑。

## 步骤 3：生成 <base>.js（JS 版数据）

把步骤 1 的结果写为 JS 文件，格式与 `data/testdata.js` 完全一致：

```js
// 注释头（说明数据用途与 image 字段含义）
const <base> = [
  {
    "image": ["<base>_images/tian_1.png", "<base>_images/tian_2.png"],
    "图片提示词": "国风儿童插画：……无文字",
    "keyword": "天",
    "logic": "上联'天'代表苍穹高远",
    "source": "天对地，雨对风",
    "analysis": "天空高远广阔，是自然空间的典型意象",
    "category": "卷上·一东"
  },
  ...
];
```

规范：
- 字段顺序：`image` → `图片提示词` → `keyword` → `logic` → `source` → `analysis` → `category`
- `image` 为**路径数组**（可多张），路径用 `<base>_images/` 前缀
- 全局变量名 = `<base>`（如 `data260802`），供 HTML 以 `<script src>` 直接引用
- UTF-8 编码，2 空格缩进，字段双引号

## 步骤 4：生成 <base>.html（展示与编辑工具）

基于 `reference/data_editor.html` 模板复制，把其中所有 `testdata_` 前缀替换为 `<base>_`（含 `testdata.js` 引用路径、`<base>_images/` 路径），文件名改为 `<base>.html`。

工具必须包含以下能力（模板已实现，改动时保持）：
- 顶部工具栏：新增卡片、删除当前卡片、**复制 `<base>.js`（打开模态框显示最新完整内容，自动全选，可一键复制到剪贴板，供手动粘贴覆盖 GitHub 上的源文件——浏览器无法直接写项目文件）**、导出 `<base>.js`、导出 JSON
- 左侧卡片列表（keyword + category），点击切换
- 右侧编辑区：所有字段可编辑（图片提示词用 textarea）
- 图片管理：缩略图网格 + 每张图「删除」；第一张图为「默认」徽章；「设为默认」把图移到数组首位（不改 schema）；「选择 `<base>_images/` 目录」按钮用 `input[webkitdirectory]` 枚举目录图片作为图片库，点击追加到 image 数组（已在数组中则禁用），另提供手动输入文件名兜底
- localStorage 自动保存草稿（key `<base>_draft`）+ 草稿提示条 +「恢复原始数据」按钮
- **草稿路径迁移**：加载草稿时把旧目录前缀（`images/`）自动迁移为 `<base>_images/`，防止重命名后裂图
- 导出 `<base>.js` 时恢复中文（JSON.stringify 后把 `\uXXXX` 还原），且与输入 JS 格式逐字节一致
- 纯原生 HTML/CSS/JS 单文件、无外部依赖、`<meta charset="utf-8">`、`file://` 双击可用
- **模态框 CSS 注意**：`.modal-mask` 显式 `display:flex` 会覆盖 `hidden` 属性（`display:none`），必须额外加 `.modal-mask[hidden]{display:none}`，否则隐藏的遮罩会拦截点击

## 步骤 4.5：移动端适配（手机审查卡片，模板已内置）

`reference/data_editor.html` 自带移动端适配（`@media (max-width:767px)`），手机打开 `<base>.html` 即可单栏审查卡片。改动模板时保持以下设计（含踩坑结论）：

**布局 = 纯 flex 固定框架（最终方案，勿改回其他方案）**
- app 高度锁死视口：`body{overflow:hidden; height:100%; height:100dvh}`（`100dvh` 兜底 iOS 地址栏，`height:100%` 兜底旧浏览器）
- **页面本身永不滚动**，只有 `#editor` 是滚动容器（`overflow-y:auto`）
- 底部横向卡片条（keyword + 韵部 + 图数 chips，横滑选卡）是 **flex 布局的固定成员**（`#main{flex-direction:column}` + `#side{order:2; height:112px; flex:none}`），永远贴在视口底部，无需滚动即可见
- 编辑器在 `#side` 上方（`order:1`），`padding-bottom:40px`

**踩坑记录（按时间顺序，均为真实用户反馈）**：
1. ☰ 按钮切换列表/编辑器方案 → 被否（列表不能隐藏，要常驻）
2. `position:fixed` 底部条 + 整页自然滚动（`body{overflow:auto}`）→ 被否：真机上 fixed 条子不可靠（需要滚动才能看见），且输入框仍"超出页面"
3. **纯 flex 固定框架（当前方案）**：不依赖 fixed、不依赖页面滚动，浏览器差异最小

**输入框"超出页面"根因与对策**：手机键盘弹出时可视区被压缩，浏览器不会自动把内层滚动容器（`#editor`）里的聚焦输入框滚入可视区 → 输入框被键盘挡住/看不见。对策：
- 聚焦时给 body 加 `kb-open` 类隐藏底部条（CSS `body.kb-open #side{display:none}`），给输入框腾出整屏空间
- **聚焦后延时 400ms 执行 `t.scrollIntoView({block:"nearest"})`**（等键盘弹出动画结束再滚，确保滚入剩余可视区）；失焦移除 `kb-open`
- 输入框/文本框字号强制 16px（`font-size:16px`），防止 iOS 聚焦自动缩放
- 编辑器内滚动到底时，最后输入框必须完整露出在底部条之上（`#editor` 的 `padding-bottom` 保证）

**其他移动端要点**：
- 点底部卡片 chip 后 `#editor.scrollTop = 0`（滚回编辑器顶部看新卡）
- ↑/↓ 键盘切卡（桌面功能）的 `scrollIntoView` 需带 `inline:"nearest"`，手机宽度下底部条横向跟随选中项
- 工具栏 `.brand .sub`、`.sep`、`.kb-hint` 隐藏；`#toolbar` 保持 `flex:none`（不要 sticky）

**移动端验收方法（CDP 模拟视口）**：
```
const np = await ctx.newPage();
await np.setViewportSize({ width: 375, height: 812 });  // 手机视口
```
逐项断言：① 页面不滚动（`document.documentElement.scrollHeight <= innerHeight`）；② 底部条贴底（`side.getBoundingClientRect().bottom <= innerHeight`）；③ 编辑器滚到底后最后输入框 `top >= 0 && bottom <= side.top`；④ 聚焦输入框 → `kb-open` 出现、条子隐藏、输入框在可视区；⑤ 失焦恢复；⑥ 点 chip 切换成功且编辑器回顶；⑦ 恢复桌面宽度（如 1440×900）布局还原。测试脚本避免用 PowerShell `-replace` 改中文注释（会破坏 UTF-8 编码导致语句被注释吞掉），直接重写文件。

## 步骤 5：验收

1. 全部产出物命名一致：`<base>.js` / `<base>.html` / `<base>_images/`
2. `<base>.js` 可用 node vm 沙箱加载，image 路径全部真实存在
3. 浏览器打开 `<base>.html`：所有卡片渲染、所有图片加载成功（无裂图）、无控制台报错
4. 编辑流程可用：增删图片、设为默认、改字段、导出（导出内容与页面数据一致）
5. **必须连接用户浏览器（9700 端口）验证，不要只在自己的新浏览器实例验证**——localStorage 按源隔离，新建实例看不到用户环境里的草稿/历史状态；用户浏览器中的旧草稿（旧目录前缀）是裂图头号元凶，验证时检查并清理 `<base>_draft`
6. 移动端验收按步骤 4.5 的 CDP 视口模拟清单逐项断言（375×812 手机视口 + 1440×900 桌面还原）

## 注意

- 只在用户明确要求时执行；不修改原始 JSON 源数据（除非用户要求）
- 图片目录命名与 HTML/JS 引用必须全程一致，避免 `images/` 与 `<base>_images/` 混用
- 图片文件用 ASCII 文件名（拼音/英文），避免跨平台问题
- **重命名/改前缀时必须全局搜索旧前缀**（不只替换 src 属性）：JS 里 `replace(/^images\//, "")` 这类正则、HTML 文本标签、README 示例、localStorage 草稿都是独立引用点，只替换数据字段会导致显示层路径残留（文件名标签/toast 显示完整路径）——改完后用 `(?<!testdata_)images/` 这类负向断言正则扫描确认无残留
- **GitHub 托管项目**：浏览器 `file://` 无法直接写项目文件，编辑工具的保存方式是「导出/复制内容 → 手动粘贴覆盖源文件」。复制实现用 `navigator.clipboard.writeText` 优先、`execCommand('copy')` 兜底（file:// 下 Clipboard API 可能受限），模态框自动全选方便 Ctrl+C
- 模态框等浮层若用 `hidden` 属性控制显隐，注意显式 `display:flex` 会覆盖 `hidden` 的 `display:none`，需补 `.modal-mask[hidden]{display:none}`
