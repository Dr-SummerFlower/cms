# 前端应用 (cms_client)

## 技术栈

- **React 18** + **TypeScript**
- **Vite 7** 构建
- **Ant Design 5** UI
- **Zustand** 状态管理
- **React Router 7** 路由
- **Axios** + 项目内封装的 `src/utils/http.ts` 发请求
- **ahooks** 常用 Hooks
- **dayjs** 日期处理

## 目录约定

- 源码在 `src/` 下，入口为 `main.tsx`，根组件为 `App.tsx`。
- 页面放在 `src/pages/`，组件放在 `src/components/`，API 调用在 `src/api/`。
- 类型定义集中在 `src/types/`，与后端 DTO/实体命名尽量对应。
- 路由配置在 `src/router/`，受保护路由使用 `protected.tsx`。

## 开发与构建

- 开发：`npm run dev`
- 构建：`npm run build`
- 规范：遵循 `eslint.config.js`，使用项目已有 ESLint/TS 配置。

## 相关 AGENTS.md

- 源码根及子目录说明见：`src/AGENTS.md` 以及 `src` 下各子目录中的 AGENTS.md。
