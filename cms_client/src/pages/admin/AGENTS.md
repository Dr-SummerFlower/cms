# 管理后台页面 (pages/admin)

上级说明见 `../AGENTS.md`（pages）。

## 职责

管理员使用的后台功能：演唱会 CRUD、用户管理、反馈管理、退单审核等。

## 当前页面/组件

- **AdminLayout.tsx** — 管理后台布局与侧边导航。
- **AdminConcerts.tsx** — 演唱会列表与操作。
- **ConcertFormModal.tsx** — 演唱会新增/编辑弹窗。
- **AdminUsers.tsx** — 用户列表与管理。
- **AdminFeedback.tsx** — 反馈列表与处理。
- **AdminRefunds.tsx** — 退单审核。

## 约定

- 所有管理端路由应受「管理员」角色保护，在 `router` 中配置。
- 列表页使用分页、筛选与后端 query 参数一致；增删改后刷新列表或更新本地状态。
- 与后端 `users`、`concerts`、`feedback`、`tickets`（退单）等模块接口对应。
