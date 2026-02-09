# 演唱会模块 (concerts)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

演唱会的 CRUD、列表查询、状态与时间管理，以及相关定时任务（如开场提醒）。

## 主要文件

- **concerts.controller.ts** — 演唱会接口（列表、详情、创建、更新等）。
- **concerts.service.ts** — 业务逻辑与 Mongoose 操作。
- **concerts-scheduler.service.ts** — 定时任务（如发送开场提醒）。
- **dto/** — 查询、创建、更新、列表响应等 DTO。
- **entities/** — 演唱会实体（Mongoose schema）。

## 约定

- 列表接口支持分页与筛选，与前端 `cms_client` 的演唱会列表、管理端 CRUD 对应。
- 时间与状态变更需考虑并发与定时任务，与 email 模块配合发送提醒时注意模板与配置。
