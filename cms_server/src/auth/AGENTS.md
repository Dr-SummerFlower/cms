# 认证模块 (auth)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

登录、注册、JWT 签发与校验、角色装饰器与守卫、验证码、登录限流、本地策略校验等。

## 主要文件

- **auth.controller.ts** — 登录、注册、刷新 Token 等接口。
- **auth.service.ts** — 认证逻辑、密码校验、Token 生成。
- **strategies/jwt.strategy.ts** — Passport JWT 策略。
- **guards/** — JWT 守卫、角色守卫。
- **decorators/** — 角色等自定义装饰器。
- **dto/** — 登录、注册、刷新等 DTO。
- **captcha.service.ts** — 验证码生成/校验。
- **login-limit.service.ts** — 登录限流（如 Redis）。
- **validation.service.ts** — 本地策略校验（如用户名格式）。

## 约定

- 敏感信息不写进 JWT payload，仅放必要标识与角色。
- 密码使用 bcrypt，不明文存储；限流与验证码与前端 `cms_client` 的登录/注册流程一致。
