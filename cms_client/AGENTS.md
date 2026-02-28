# 前端应用 (cms_client)

## 代码导航与重构规范

**利用 LSP (语言服务器协议) 进行智能导航**
在 React + TypeScript 项目中，始终通过 MCP 使用 LSP 来执行以下操作：

*   **查找组件/函数/Hook 的所有引用**：
    `typescript_find_references("UserProfile")` 或 `typescript_find_references("useAuth")`
    *(适用于查找组件在哪里被使用，或自定义 Hook 在哪里被调用)*
*   **理解 Props 和状态类型**：
    `typescript_get_type_definition("props.userId")` 或 `typescript_get_type_definition("state.count")`
    *(快速跳转至接口定义或类型声明，确认数据结构)*
*   **安全重命名**：
    `typescript_rename_symbol("OldComponentName", "NewComponentName")`
    *(重命名组件、Hook、工具函数或类型接口，自动更新所有 import 和 JSX 标签)*
*   **查找实现**：
    `typescript_find_implementations("BaseButtonProps")`
    *(查找实现了特定接口或继承自基类的所有组件)*
*   **检查 JSX 和逻辑错误**：
    `typescript_get_diagnostics()`
    *(捕获类型不匹配、缺失 Props 或无效的 JSX 结构)*

**切勿使用文本搜索 (grep) 进行重构：**

*   ❌ `grep -r "Button"`
    *   **风险**：会匹配到注释中的文字、字符串内容（如 `"Click the Button"`）、变量名片段（如 `submitButton`），甚至其他库中的同名导出。在 React 中，这极易导致误改 JSX 标签内的文本内容。
*   ✅ `typescript_find_references("Button")`
    *   **优势**：仅定位实际的代码引用（import 语句、JSX 标签 `<Button />`、类型引用），忽略字符串和注释，确保重构安全。

**核心权衡**：
*   **LSP**：速度稍慢（约 1-2 秒），但具备“智能”语义理解，能区分 JSX 标签、普通文本和变量名。
*   **文本搜索**：速度快，但“盲目”匹配字符，在复杂的 JSX 结构和 TypeScript 类型系统中极易出错。

## 技术栈

- **React 18** + **TypeScript**
- **Vite 7** 构建
- **Ant Design 5** UI
- **Zustand** 状态管理
- **React Router 7** 路由
- **Axios** + 项目内封装的 `src/utils/http.ts` 发请求
- **ahooks** 常用 Hooks
- **dayjs** 日期处理

## 目录约定

- 源码在 `src/` 下，入口为 `main.tsx`，根组件为 `App.tsx`。
- 页面放在 `src/pages/`，组件放在 `src/components/`，API 调用在 `src/api/`。
- 类型定义集中在 `src/types/`，与后端 DTO/实体命名尽量对应。
- 路由配置在 `src/router/`，受保护路由使用 `protected.tsx`。

## 开发与构建

- 开发：`npm run dev`
- 构建：`npm run build`
- 规范：遵循 `eslint.config.js`，使用项目已有 ESLint/TS 配置。

## 相关 AGENTS.md

- 源码根及子目录说明见：`src/AGENTS.md` 以及 `src` 下各子目录中的 AGENTS.md。
