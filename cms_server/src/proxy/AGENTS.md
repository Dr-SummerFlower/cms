# 代理模块 (proxy)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

HTTP 代理转发，将指定路径的请求转发到后端或第三方服务。

## 主要文件

- **proxy.controller.ts** — 接收代理请求的路由。
- **proxy.service.ts** — 转发逻辑（如使用 http-proxy-middleware）。
- **proxy.module.ts** — 模块定义。

## 约定

- 代理目标与路径通过配置或环境变量管理，不写死敏感地址。
- 注意请求头、超时与错误处理，与前端调用的路径一致。
