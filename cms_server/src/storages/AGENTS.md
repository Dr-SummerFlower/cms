# 存储模块 (storages)

上级模块说明见 `../AGENTS.md`（src）。

## 职责

对象存储（如 MinIO）的封装：上传、下载、删除等，供其他模块使用。

## 主要文件

- **storages.module.ts** — 模块定义与导出。
- **storages.service.ts** — 存储操作的实现。

## 约定

- 凭证与 endpoint 从配置/环境变量读取；对外提供统一接口，便于替换存储后端。
- 与 concerts、users 等使用方约定 key 命名与访问策略，避免冲突。
