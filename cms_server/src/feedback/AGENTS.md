# 反馈模块 (feedback)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

用户反馈的提交、列表与查询（含管理端）。

## 主要文件

- **feedback.controller.ts** — 提交反馈、管理端列表/查询等接口。
- **feedback.service.ts** — 业务逻辑与 Mongoose 操作。
- **dto/** — 创建反馈、查询、列表响应等 DTO。
- **entities/** — 反馈实体（Mongoose schema）。

## 约定

- 与前端 `cms_client` 的反馈提交及管理端反馈列表接口一致；分页与筛选与前端约定对齐。
