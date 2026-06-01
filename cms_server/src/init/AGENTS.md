# 初始化模块 (init)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

应用启动时的初始化逻辑（如默认数据、配置校验、依赖就绪检查等）。

## 主要文件

- **init.module.ts** — 模块定义。
- **init.service.ts** — 具体初始化逻辑（如 onModuleInit）。
- **init-data.constant.ts** — 种子数据与内置资源；测试用户头像复用 `DEFAULT_AVATAR_BASE64`，海报可填
  `TEST_CONCERT_POSTER_BASE64`。

注： 测试种子数据仅在 `RUNNING_ENV=test`（如 `npm run start:test`）时写入；默认管理员在各环境均会按需创建。

## 约定

- 初始化失败应阻止应用正常启动或明确告警，避免静默失败。
- 与业务模块解耦，通过依赖注入或事件与业务模块协作。
- `RUNNING_ENV=test` 时由 `seedTestData()` 写入压测账号与示例演唱会；常量见 `init-data.constant.ts`。
- JMeter 性能测试位于 `tests/jmeter/`，通过 `npm run perf:*` 执行，见该目录 `README.md`。
