# 检票员页面 (pages/inspector)

上级说明见 `../AGENTS.md`（pages）。

## 职责

检票员使用的核验相关页面：扫码核验、核验历史等。

## 当前页面

- **InspectorVerify.tsx** — 核验操作（如扫码核验票据）。
- **VerifyHistory.tsx** — 核验历史列表/查询。

## 约定

- 路由需受「检票员」或相应角色保护，与后端核验接口（如 `tickets` 模块的核验 API）配合。
- 扫码使用 `components/qrcode` 下的组件，核验结果与错误需明确反馈给用户。
