# 使用提示词（Usage Prompts）

> 本文件保存可直接复制使用的提示词，供后续会话调用 flashcard-data-builder skill。
> 使用前只需替换：md 文件名、输出文件名、项目目录。
> **流程版本：v2（2026-08-04 实测跑通）**——keyword 拆分不总结、category 细化到段、pair 对仗关联。

---

## 1. 完整版（推荐，首次使用）

```
请使用 flashcard-data-builder skill，从 md 生成闪卡数据：
1. 读取 <凯叔笠翁对韵_260803.md>（完整路径：<C:\...\data\凯叔笠翁对韵_260803.md>）
2. 解析 30 韵部 90 段，category 细化到段（格式：卷上·一东·其一）
3. keyword 从原文拆分实词，不总结、不合并、不造词（如 过天星/吐魄月/箭/弓 是 4 张卡）
4. 用 6 个并行 agent 分批填充 logic（上联'X'指…，禁用"总结为"）+ analysis（15~40字，成对卡互补）
5. 生成 pair 字段（category·keyword 格式，双向关联），node 脚本校验 0 broken
6. 全量校验：0 空字段、0 处"总结为"、字段序 image>keyword>logic>source>analysis>category>pair
7. 输出：data/<base>_2.json（JSON 2 空格缩进、中文不转义）

文件位置：<项目目录，如 C:\Users\bruce\Desktop\bruce\flash_card>
```

---

## 2. 精简版（后续使用）

```
使用 flashcard-data-builder skill 把 <凯叔笠翁对韵_260803.md> 生成闪卡数据：
keyword 拆分不总结、category 到段、logic 禁"总结为"、pair 双向关联校验，输出 data_凯叔笠翁对韵_260803_2.json。
```

---

## 3. 只补 pair 字段（数据已有，缺对仗关联）

```
使用 flashcard-data-builder skill，为 <data_凯叔笠翁对韵_260803_2.json> 补齐 pair 字段：
按 category·keyword 格式关联对仗卡，node 脚本双向校验 0 broken，输出统计 paired/total。
```

---

## 4. 会话删除后的恢复指引

1. **打开 skill 目录**：`flash_card\.opencode\skills\flashcard-data-builder\`
2. **读 SKILL.md**：完整工作流（schema、keyword 拆分规则、并行 agent 填充、pair 校验、验收清单）
3. **读本文件**：挑选提示词模板，替换占位符后发给 AI
