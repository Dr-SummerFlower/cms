# 后端源码根 (src)

## 模块结构

- **app.module.ts** — 根模块，聚合各业务模块与全局模块。
- **auth/** — 认证（登录、注册、JWT、角色、限流、验证码等）。
- **concerts/** — 演唱会 CRUD、定时任务等。
- **tickets/** — 票务（下单、退票、核验、核验记录等）。
- **users/** — 用户信息、实名、角色管理等。
- **feedback/** — 用户反馈。
- **email/** — 邮件发送（验证码、通知等）。
- **ecdsa/** — ECDSA 相关（如签名/验签）。
- **proxy/** — 代理转发。
- **storages/** — 存储（如 MinIO）。
- **global/** — 全局过滤器、拦截器、模块。
- **init/** — 应用初始化逻辑。
- **types/** — 公共 TypeScript 类型。

## 约定

- 新增业务先在对应模块下实现，必要时新建模块并在 `app.module` 中注册。
- Controller 只做参数校验与调用 Service；业务逻辑在 Service；DTO 与实体与前端类型对应。
- 修改接口或 DTO 时，同步更新 Swagger 与前端 `cms_client/src/api` 和类型。

## 各模块 AGENTS.md

各模块职责与约定见其目录下的 AGENTS.md（如 `auth/AGENTS.md`、`concerts/AGENTS.md` 等）。
