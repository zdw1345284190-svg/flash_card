# 使用提示词（Usage Prompts）

> 本文件保存可直接复制使用的提示词，供后续会话调用 doubao-flashcard-generator skill。
> 使用前只需替换：文件名、完整路径、项目目录。
> **流程已更新（2026-08-03）**：不再产出 `<base>.js` / `<base>.html`；图片结果**直接写回 `<base>.json`**，审核工具为 `<base>-review.html`（**上传 JSON 加载，数据不自动加载，需点击**）。

---

## 1. 完整版（推荐，首次使用）

```
请使用 doubao-flashcard-generator skill，处理闪卡数据文件 <data_260802.json>（完整路径：<C:\...\data_260802.json>）。

要求：
1. 为每张卡生成「图片提示词」（国风儿童插画风格，横版，无文字后缀）
2. 通过调试端口 9700 的浏览器（豆包）逐张生成并下载图片到 <base>_images/ 目录
3. 运行构建脚本（work_data260802/build.js），把「图片提示词 + image 数组」直接写回 data/<base>.json（字段序 image > 图片提示词 > keyword > logic > source > analysis > category，JSON 2 空格缩进中文不转义），并从 reference/data_review.html 模板生成 <base>-review.html 审核工具
4. 图片生成时严格遵守频率与会话规则：每轮提交间隔 ≥20 秒；单会话生成约 10 次后若超限则切换到新的豆包会话继续；支持断点续做（跳过已有图片的卡）；检测到限流提示立即停止
5. 完成后按 skill 验收清单自查：json 图片路径全部存在无重复、提示词无 undefined、审核页上传 json 后卡片全渲染无裂图无控制台报错，并在 9700 浏览器实测确认

文件位置：<项目目录，如 C:\Users\bruce\Desktop\bruce\flash_card>
```

---

## 2. 精简版（后续使用）

```
使用 doubao-flashcard-generator skill 处理 <data_260802.json>：生成 <base>_images/ 图片 → build.js 把「图片提示词 + image」写回 data/<base>.json → 生成 <base>-review.html 审核工具（上传 JSON 加载）。注意豆包生成频率与会话次数限制（超限切换新会话、断点续做）。
```

---

## 3. 只生成图片（已有数据文件，不需要重新构建）

```
使用 doubao-flashcard-generator skill，只为 <data_260802.json> 生成图片：
1. 为每张卡写图片提示词
2. 在 9700 端口浏览器（豆包）生成并下载到 <base>_images/
3. 运行 build.js 把 image 数组与图片提示词写回 data/<base>.json
注意控制生成频率，会话超限时切换新会话续跑，支持断点续做。
```

---

## 4. 只重新生成审核工具（图片与 json 已就绪）

```
使用 doubao-flashcard-generator skill，为已含 image 字段的 <data_260802.json> 重新生成 <base>-review.html 审核工具（复制 reference/data_review.html 模板，替换 __BASE__ 为 <base>；审核页上传 JSON 加载、编辑后导出 JSON 覆盖源文件，数据一律不自动加载）。
```

---

## 5. 会话删除后的恢复指引

若当前会话已删除，按以下步骤恢复：

1. **打开 skill 目录**：`flash_card\.opencode\skills\doubao-flashcard-generator\`
2. **读 SKILL.md**：完整工作流文档（输入输出、步骤 1~5、已知坑、频率与会话规则、验收清单）
3. **读本文件**：挑选上面的提示词模板，替换位置类似占位符后发给 AI
4. **读 reference/ 模板**：`gen_images.js`（豆包生成脚本，含断点续做与限流保护）、`data_review.html`（审核工具模板：上传 JSON 加载 + 底部横滑卡条移动端布局，`__BASE__` 占位符）

三个文件配合使用即可完整复现整个工作流。