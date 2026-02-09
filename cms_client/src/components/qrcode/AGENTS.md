# 二维码组件 (components/qrcode)

上级说明见 `../AGENTS.md`（components）。

## 职责

与二维码扫描、展示相关的 UI 与逻辑（如检票扫码）。

## 当前组件

- **Html5QrScanner.tsx** — 基于 html5-qrcode 的扫码组件。

## 约定

- 与后端核验接口配合使用，扫码结果通过回调传给上层（如 `pages/inspector`）。
- 注意摄像头权限与错误提示，保持与项目整体 UX 一致。
