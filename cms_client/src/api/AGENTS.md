# API 层 (api)

上级目录说明见 `../AGENTS.md`（src）。

## 职责

封装对后端 `cms_server` 的 HTTP 请求，按业务模块划分文件。

## 文件约定

- **auth.ts** — 登录、注册、刷新 Token 等认证相关。
- **concerts.ts** — 演唱会列表、详情、创建/更新（管理端）等。
- **tickets.ts** — 购票、订单、退票、核验等。
- **users.ts** — 用户信息、修改资料、管理端用户列表等。
- **feedback.ts** — 反馈提交与列表。
- **verify.ts** — 检票/核验相关接口。
- **_transform.ts** — 后端原始响应与前端类型的转换（如 `_id` → `id`、图片 URL 等），供各 API 复用。

## 约定

- 使用 `src/utils/http.ts` 提供的实例发请求，不要直接 `axios.create`。
- 请求/响应类型使用 `src/types/` 中的定义，与后端 DTO 对齐。
- 若后端新增或修改接口，在此同步更新函数与类型；错误处理统一在 `http.ts` 或此处按需处理。
