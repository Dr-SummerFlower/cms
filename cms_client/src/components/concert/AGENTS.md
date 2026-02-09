# 演唱会相关组件 (components/concert)

上级说明见 `../AGENTS.md`（components）。

## 职责

演唱会列表、筛选、卡片展示等与「演唱会」强相关的 UI 组件。

## 当前组件

- **ConcertCard.tsx** — 单场演唱会的卡片展示。
- **SearchFilter.tsx** — 演唱会列表的搜索与筛选条件。

## 约定

- 数据由父组件（如 `pages/HomePage` 或管理端列表页）传入，组件负责展示与用户交互回调。
- 类型使用 `src/types/` 中与演唱会相关的定义，与后端 concert 接口一致。
