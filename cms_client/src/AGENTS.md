# 前端源码根 (src)

## 结构说明

- **api/** — 对后端接口的封装，按业务划分（auth、concerts、tickets、users 等）。
- **components/** — 可复用 UI 组件（通用、演唱会、布局、二维码等）。
- **pages/** — 页面级组件与路由对应（首页、详情、购票、管理后台、检票等）。
- **router/** — 路由定义与受保护路由逻辑。
- **stores/** — Zustand 状态（auth、concert、theme、ticket 等）。
- **types/** — 全局 TypeScript 类型/接口，与后端模型对应。
- **utils/** — 工具函数（HTTP、认证、Cookie、图片等）。

## 约定

- 新页面在 `pages/` 下添加，并在 `router/index.tsx` 中注册路由。
- 新 API 在 `api/` 下按模块添加，使用 `utils/http.ts` 发请求。
- 共享类型放在 `types/index.ts` 或对应模块类型文件。
- 修改接口或类型时，保持与后端 `cms_server` 的 DTO/响应结构一致。

## 子目录 AGENTS.md

各子目录的职责与约定见其目录下的 AGENTS.md（如 `api/AGENTS.md`、`components/AGENTS.md` 等）。
