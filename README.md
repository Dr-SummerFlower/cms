# 演唱会管理系统 (Concert Management System)

演唱会/票务管理系统的单体仓库，包含前端与后端，支持演出管理、购票、验票、退款与反馈等能力。

## 技术栈

| 部分 | 技术 |
|------|------|
| 前端 | React 18、TypeScript、Vite 7、Ant Design 5、Zustand、React Router 7 |
| 后端 | NestJS 11、MongoDB（Mongoose）、Redis、JWT、Swagger、MinIO、Nodemailer |

## 仓库结构

- **cms_client/** — 前端应用（React + Vite + TypeScript）
- **cms_server/** — 后端服务（NestJS + MongoDB）
- **scripts/** — 构建/打包脚本
- **docker-compose.yml** / **Dockerfile** — 容器化部署

## 环境要求

- Node.js 22+
- MongoDB
- Redis（按后端配置使用）
- 后端环境变量见 `cms_server/.env.example`

## 快速开始

### 后端

```bash
cd cms_server
cp .env.example .env   # 按需编辑 .env
npm install
npm run start:dev
```

### 前端

```bash
cd cms_client
npm install
npm run dev
```

### Docker

```bash
# 根据项目 docker-compose 与 Dockerfile 配置启动
docker-compose up -d
```

## 开发约定

- 注释、提交说明与项目文档使用**简体中文**。
- 后端 API 变更需同步更新前端 `cms_client/src/api` 与类型定义。

## 许可证

本项目采用 [MIT License](LICENSE) 开源协议。
