# 组件目录 (components)

上级目录说明见 `../AGENTS.md`（src）。

## 结构

- **common/** — 通用小组件（如验证码输入、状态标签等）。
- **concert/** — 演唱会相关（卡片、搜索筛选等）。
- **layout/** — 布局组件（Header、Footer）。
- **qrcode/** — 二维码扫描相关（如 Html5QrScanner）。
- 根目录 — 跨页面复用的组件（如 ErrorBoundary）。

## 约定

- 组件以 PascalCase 命名，单文件组件与目录名一致（如 `ConcertCard.tsx` 在 `concert/` 下）。
- 优先使用 Ant Design 组件，样式与项目主题一致。
- 若组件依赖 API，通过 props 或上层页面传入数据，避免在组件内直接调用 `api/`（除纯通用封装外）。
- 子目录的职责见各子目录下的 AGENTS.md。
