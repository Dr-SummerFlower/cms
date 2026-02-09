# 布局组件 (components/layout)

上级说明见 `../AGENTS.md`（components）。

## 职责

全局或多页共用的布局结构（页头、页脚等）。

## 当前组件

- **Header.tsx** — 顶部导航/头部。
- **Footer.tsx** — 页脚。

## 约定

- 布局组件负责结构、导航链接与占位，不承载具体业务数据获取。
- 与路由的联动通过 React Router 的 Link/NavLink 或 `useNavigate` 实现。
