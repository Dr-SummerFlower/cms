# 邮件模块 (email)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

发送邮件：验证码、演唱会提醒、退票结果等，使用 Nodemailer 与 pug 模板。

## 主要文件

- **email.controller.ts** — 发送验证码等对外接口（若需）。
- **email.service.ts** — 发信逻辑与模板渲染。
- **email.module.ts** — 模块定义。
- **dto/** — 发送验证码等 DTO。

## 约定

- 邮件模板放在 **cms_server 根目录**下的 `template/`（如 verification-code.pug、concert-reminder.pug、refund-rejection.pug），与 Mailer 配置中的路径一致。
- 发信失败需记录或抛出，便于排查；敏感配置从环境变量读取。
