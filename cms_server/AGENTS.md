# 后端服务 (cms_server)

## 技术栈

- **NestJS 11**
- **MongoDB**（Mongoose）
- **Redis**（@nestjs-redis）
- **JWT**（@nestjs/jwt + passport-jwt）
- **class-validator / class-transformer** 校验与序列化
- **Swagger** 文档
- **MinIO** 对象存储
- **Nodemailer** 邮件
- **Schedule** 定时任务

## 目录约定

- 源码在 `src/` 下，入口为 `main.ts`，根模块为 `app.module.ts`。
- 按业务拆分为模块：auth、concerts、tickets、users、feedback、email、ecdsa、proxy、storages、global、init 等。
- 各模块内含 controller、service、dto、entities（如用 Mongoose 则含 schema）。
- 公共类型与工具在 `src/types/`。

## 开发与构建

- 开发：`npm run start:dev`
- 生产：`npm run build` 后 `npm run start:prod`
- 规范：遵循 `eslint.config.mjs` 与 `.prettierrc`，环境变量参考 `.env.example`。

## 相关 AGENTS.md

- 源码根与各模块说明见：`src/AGENTS.md` 以及 `src` 下各模块目录中的 AGENTS.md。
