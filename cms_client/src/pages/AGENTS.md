# 页面目录 (pages)

上级目录说明见 `../AGENTS.md`（src）。

## 结构

- **admin/** — 管理后台（演唱会、用户、反馈、退单等）。
- **inspector/** — 检票员端（核验、核验历史等）。
- 根目录 — 用户端页面：首页、登录、注册、演唱会详情、购票、订单/票详情、个人资料等。

## 约定

- 每个页面对应路由中的一条或多条路径，在 `src/router/index.tsx` 中配置。
- 需要登录或角色的页面使用 `router/protected.tsx` 或等价守卫。
- 页面内可调用 `src/api/` 与 `src/stores/`，组件化复杂逻辑到 `src/components/`。
- 子目录（admin、inspector）的职责见各自 AGENTS.md。
