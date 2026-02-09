# 通用小组件 (components/common)

上级说明见 `../AGENTS.md`（components）。

## 职责

与业务弱耦合的通用 UI 组件，可在多页面复用。

## 当前组件

- **CaptchaInput.tsx** — 验证码输入（与后端验证码接口配合）。
- **StatusTag.tsx** — 状态标签展示（如订单/演唱会状态）。

## 约定

- 保持组件无业务路由依赖，通过 props 接收数据与回调。
- 样式与 Ant Design 保持一致，必要时使用项目内 CSS 变量或主题。
