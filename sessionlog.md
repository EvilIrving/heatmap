## 修复 pre-commit skill 注册问题

time: 2026-03-10

source: qwen-code

topic: skill 配置修复

tags: [config, bugfix]

summary:
诊断并修复 pre-commit skill 无法加载的问题。发现 SKILL.md 缺少必需的 version 字段。

decisions:
- 为 pre-commit skill 添加 version: 1.0.0
- 使用 YAML 多行字符串格式 (|) 保持 description 可读性

notes:
- 对比其他可用 skill (如 humanizer)，发现它们都有 version 字段
- pre-commit skill 用于根据 staged diff 生成 Conventional Commits 消息

reason:
- skill 注册系统需要 version 字段才能识别和加载
- 缺少 version 导致 skill 无法出现在 <available_skills> 列表中

refs:
- .qwen/skills/pre-commit/SKILL.md
- .qwen/skills/humanizer/SKILL.md (参考模板)

---

## 初始化项目上下文

time: 2026-03-10

source: qwen-code

topic: 项目环境设置

tags: [config]

summary:
设置聊天会话上下文，确认项目基础信息。

decisions:
- 工作目录：/Users/cain/Documents/code/vue-heatmap
- 项目类型：Vue + Vite + TypeScript + UnoCSS

notes:
- 项目包含多个截图文件（设计稿、错误截图等）
- 使用 pnpm 作为包管理器
- 已配置 UnoCSS (uno.config.ts) 和 Vite (vite.config.ts)

refs:
- package.json
- vite.config.ts
- uno.config.ts
