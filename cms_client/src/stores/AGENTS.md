# 状态管理 (stores)

上级目录说明见 `../AGENTS.md`（src）。

## 技术

使用 **Zustand**，按业务拆分为多个 store 文件。

## 当前 Store

- **authStore.ts** — 登录状态、用户信息、Token 等。
- **concertStore.ts** — 演唱会列表/筛选等前端状态（若需）。
- **themeStore.ts** — 主题（如明暗色）等。
- **ticketStore.ts** — 与票务相关的客户端状态（若需）。

## 约定

- 与认证强相关的状态放在 authStore，避免在多个 store 重复存用户信息。
- 服务端数据以 API 请求为准，store 可做缓存或 UI 状态；重要数据以服务端为准。
