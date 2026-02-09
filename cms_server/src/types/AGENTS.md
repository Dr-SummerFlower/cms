# 公共类型 (types)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

后端共用的 TypeScript 类型、接口（如 JWT payload、响应体、业务枚举等）。

## 主要文件

- **index.ts** — 汇总导出。
- **auth.ts**、**concert.ts**、**ticket.ts**、**user.ts**、**response.ts**、**proxy.ts**、**ecdsa.ts** 等 — 按领域划分的类型。

## 约定

- 与 DTO、实体、前端类型命名与结构尽量一致，便于前后端协作。
- 新增或修改类型时，检查 Controller/Service 与前端引用处是否需同步更新。
