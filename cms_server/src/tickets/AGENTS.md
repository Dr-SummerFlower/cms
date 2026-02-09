# 票务模块 (tickets)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

购票下单、订单查询、退票申请与审核、核验与核验记录等。

## 主要文件

- **tickets.controller.ts** — 下单、订单列表、退票、核验、核验历史等接口。
- **tickets.service.ts** — 订单与核验业务逻辑。
- **dto/** — 下单、退票、核验、查询、审核等 DTO。
- **entities/** — 票/订单实体、核验记录实体（Mongoose schema）。

## 约定

- 与前端 `cms_client` 的购票、订单、退单、检票员核验流程及 API 对齐。
- 核验与 ECDSA 等安全逻辑保持一致；退单审核与邮件/通知配合。
