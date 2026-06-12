# 演唱会管理系统 (Concert Management System)

基于 NestJS + React 的全流程票务管理系统，覆盖演出管理、在线购票、电子票核验、退票审核等业务。

## 技术栈

### 前端 (`cms_client`)

| 类别     | 技术                  |
| -------- | --------------------- |
| 框架     | React 18 + TypeScript |
| 构建     | Vite 7                |
| UI       | Ant Design 5          |
| 状态管理 | Zustand               |
| 路由     | React Router 7        |
| 工具     | Axios、dayjs、ahooks  |
| 扫码     | html5-qrcode          |

### 后端 (`cms_server`)

| 类别     | 技术                                          |
| -------- | --------------------------------------------- |
| 框架     | NestJS 11 + TypeScript                        |
| 数据库   | MongoDB 8 (Mongoose)                          |
| 缓存     | Redis 8                                       |
| 认证     | JWT (Passport)                                |
| 文件存储 | MinIO(推荐版本：RELEASE.2024-06-13T22-53-53Z) |
| 邮件     | Nodemailer                                    |
| 二维码   | qrcode                                        |
| 图片处理 | sharp                                         |

## 快速启动（开发环境）

1. **克隆仓库并安装依赖**

```bash
git clone https://github.com/Dr-SummerFlower/cms.git
cd cms

# 安装后端依赖
cd cms_server && npm i

# 安装前端依赖
cd ../cms_client && npm i
```

2. **配置环境变量**

```bash
# 复制后端环境变量模板并修改
cp cms_server/.env.example cms_server/.env.dev
# 编辑 cms_server/.env.dev，填写 MongoDB、Redis、JWT 密钥等配置
```

3. **启动基础服务**

确保 MongoDB、Redis、MinIO 已运行（可使用 Docker Compose 或本地安装）。

4. **启动后端开发服务**

```bash
cd cms_server
npm run start:dev
```

5. **启动前端开发服务**

```bash
cd cms_client
npm run dev
```

## Docker 部署（生产环境）

```bash
# 1. 配置环境变量
cp docker-compose.env .env
# 编辑 .env，修改所有密码、密钥及邮件配置

# 2. 构建前端（产物输出至 cms_data/site/）
cd cms_client && npm run build:docker && cd ..

# 3. 构建后端（产物自动输出至 cms_data/server/）
cd cms_server && npm run build:docker && cd ..

# 4. 启动所有服务
docker compose up -d
```

> **说明**：
> - 前端构建产物通过 volumes 挂载至 Caddy 容器的 `/site` 目录进行静态服务
> - 后端构建产物（`dist/`、`package.json`、`package-lock.json`、`template/`）挂载至 `cms_app` 容器的 `/app` 目录，容器首次启动时自动安装生产依赖后运行 `node main.js`
> - `redis.conf` 即使为空文件也可正常工作，Redis 密码通过命令行参数传入

服务启动后通过 Caddy 代理访问，默认端口 80/443。

## 用户角色

| 角色                | 权限                                 |
| ------------------- | ------------------------------------ |
| GUEST（访客）       | 浏览演出列表与详情                   |
| USER（用户）        | 购票、退票、查看电子票、编辑个人资料 |
| INSPECTOR（检票员） | 扫码验票、查看验票历史               |
| ADMIN（管理员）     | 演出管理、用户管理、退票审核、检票   |

## 项目结构

```
concert_management_system/
├── cms_client/          # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── api/         # API 请求层
│   │   ├── components/  # 通用/业务组件
│   │   ├── pages/       # 页面组件
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Zustand 状态管理
│   │   └── utils/       # 工具函数
│   └── public/          # 静态资源
├── cms_server/          # 后端服务 (NestJS)
│   ├── src/
│   │   ├── auth/        # 认证模块
│   │   ├── concerts/    # 演出管理模块
│   │   ├── tickets/     # 票务模块
│   │   ├── users/       # 用户模块
│   │   ├── email/       # 邮件模块
│   │   ├── storages/    # 文件存储模块
│   │   └── ecdsa/       # ECDSA 签名模块
│   ├── template/        # 邮件模板 (Pug)
│   └── tests/           # 单元测试 & 性能测试
├── cms_data/            # 持久化数据目录
├── docker-compose.yml   # 容器编排
└── Dockerfile           # 应用镜像构建
```

## 许可证

[MIT](LICENSE.md) © 2026 Summer Flower
