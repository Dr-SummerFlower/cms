# 演唱会管理系统 (Concert Management System)

## 项目概述

本仓库为演唱会/票务管理系统的单体仓库，包含前端 `cms_client` 与后端 `cms_server`。AI 在本项目中工作时，应优先阅读当前工作目录及其父级目录下的 AGENTS.md，以遵循该区域的约定。

## 仓库结构

- **cms_client/** — 前端应用（React + Vite + TypeScript）
- **cms_server/** — 后端服务（NestJS + MongoDB）
- **scripts/** — 构建/打包脚本
- **docker-compose.yml** / **Dockerfile** — 容器化部署

## 通用约定

- 使用**简体中文**编写注释、提交说明和与项目相关的文档。
- 修改后端 API 时，如影响前端调用，需同步更新前端的 `cms_client/src/api` 与类型定义。
- 新增或修改数据模型时，若存在 `doc/` 及其中数据库设计文档（如 `数据库表单设计.md`），请参考并保持与现有设计一致。

## 相关 AGENTS.md

- 前端约定与结构见：`cms_client/AGENTS.md`、`cms_client/src/AGENTS.md` 及各子目录。
- 后端约定与模块见：`cms_server/AGENTS.md`、`cms_server/src/AGENTS.md` 及各模块根目录。
