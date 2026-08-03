# 使用提示词（Usage Prompts）

> 本文件保存可直接复制使用的提示词，供后续会话调用 flashcard-print-html skill。
> 使用前只需替换：文件名（`<base>`）、数据文件位置、项目目录。

---

## 1. 完整版（推荐，首次使用）

```
请使用 flashcard-print-html skill，将闪卡数据文件 <data/testdata.js>（<base> = testdata，完整路径：<C:\...\flash_card\data\testdata.js>）生成为可打印闪卡 HTML。

要求：
1. 按 skill 定稿设计规范生成 <base>_card.html（B5 横版 250×176mm、一卡一页、正面=完整图片+圆角、背面=大 keyword+角落小字、双面打印长边翻转即成品无需裁剪）
2. 参考模板：.opencode/skills/flashcard-print-html/reference/flashcard_print.html（替换 __BASE__ 为 <base>）
3. 屏幕预览保留 3D 翻面与多图圆点选择，选图同步打印页
4. 完成后按 skill 验证清单自查：page.pdf 的 MediaBox = 708.96×498.96pt、页数 = 卡片数×2、无空白页、无裂图、无控制台报错

文件位置：<项目目录，如 C:\Users\bruce\Desktop\bruce\flash_card>
```

---

## 2. 精简版（后续使用）

```
使用 flashcard-print-html skill 将 <data/testdata.js> 生成为 <testdata>_card.html（按 skill 定稿规范，B5 横版一卡一页，验证后交付）。
```

---

## 3. 只调整打印版式（已有 <base>_card.html）

```
调整 <base>_card.html 的打印版式：<描述具体改动，如纸张规格/卡片尺寸/正反面内容/字号/布局>，保持一卡一页、双面长边翻转配对与验证清单不变。
```

---

## 4. 会话删除后的恢复指引

若当前会话已删除，按以下步骤恢复：

1. **读 SKILL.md**：`flash_card\.opencode\skills\flashcard-print-html\SKILL.md`（定稿设计规范、技术要点、验证清单、已知坑与对策）
2. **读本文件**：`reference/USAGE.md`（挑选上面的提示词模板，替换占位符后发给 AI）
3. **读 reference/ 模板**：`flashcard_print.html`（打印版模板，`__BASE__` 占位符，含完整 CSS/JS）

三个文件配合使用即可完整复现整个打印工作流。
