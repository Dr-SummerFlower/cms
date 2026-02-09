# 全局模块 (global)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

应用级横切逻辑：全局异常过滤器、响应拦截器等。

## 主要文件

- **global.module.ts** — 注册全局过滤器、拦截器。
- **global.filter.ts** — 统一异常处理与响应格式。
- **global.interceptor.ts** — 统一成功响应包装等。

## 约定

- 与前端约定的 HTTP 状态码与 body 结构一致，便于 `cms_client/utils/http.ts` 统一处理。
- 不在本模块写业务逻辑，仅做请求/响应的统一形态处理。
