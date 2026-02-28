# 后端服务 (cms_server)

## 技术栈

- **NestJS 11**
- **MongoDB**（Mongoose）
- **Redis**（@nestjs-redis）
- **JWT**（@nestjs/jwt + passport-jwt）
- **class-validator / class-transformer** 校验与序列化
- **Swagger** 文档
- **MinIO** 对象存储
- **Nodemailer** 邮件
- **Schedule** 定时任务

## 目录约定

- 源码在 `src/` 下，入口为 `main.ts`，根模块为 `app.module.ts`。
- 按业务拆分为模块：auth、concerts、tickets、users、feedback、email、ecdsa、proxy、storages、global、init 等。
- 各模块内含 controller、service、dto、entities（如用 Mongoose 则含 schema）。
- 公共类型与工具在 `src/types/`。

## 单元测试

本章节规定项目中单元测试（Unit Test）的编写规范、目录结构及核心原则。所有开发人员必须严格遵守，以确保测试的可维护性、独立性和执行效率。

typescript的类型应该优先引用源码中的类型（接口、DTO、枚举等），避免重复定义。

### 1. 目录结构与文件组织

- **统一存放位置**：所有测试代码必须统一放入项目根目录下的 `tests` 文件夹中。
- **分类管理**：
  - `tests/unit/`：存放纯单元测试代码，严禁包含任何真实外部依赖调用。
  - `tests/e2e/`：存放端到端测试代码（E2E），允许连接测试数据库，但需遵循隔离策略。
- **文件命名**：测试文件采用 `<feature>.spec.ts` 的命名方式，确保能快速定位对应的业务模块。

### 2. 测试命名规范

- **描述性命名**：测试名称（`it` 块的描述）必须清晰说明“在什么条件下，应该有什么行为”。
  - ✅ 推荐：`it('当没有猫时，应返回 404', ...)`
  - ❌ 禁止：`it('test cat', ...)` 或 `it('works', ...)`
- **语言要求**：使用中文描述，则格式为：`it('当猫不存在时，应返回 404', ...)`。

### 3. 代码结构：三 A 模式 (AAA)

每个测试用例必须严格按照 **Arrange（准备）**、**Act（执行）**、**Assert（断言）** 三个阶段组织，并使用**空行**分隔，以提高可读性。

```typescript
it('should return user profile when id is valid', async () => {
  // Arrange
  const mockUser = { id: '123', name: 'Alice' };
  jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

  // Act
  const result = await userService.getUser('123');

  // Assert
  expect(result).toEqual(mockUser);
  expect(userRepository.findOne).toHaveBeenCalledWith('123');
});
```

### 4. 单一职责原则

- **一个 `it` 块只测试一个逻辑点**：严禁在同一个测试用例中验证多个不相关的行为。
- **目的**：确保测试失败时能快速定位具体问题，避免连锁反应导致的误判。
- **场景拆分**：如果有多个输入条件或预期结果，请拆分为多个 `it` 块。

### 5. 初始化与复用

- **共享初始化**：如果多个测试场景需要相似的准备数据，使用 `describe` 进行嵌套分组，并利用 `beforeEach` 共享初始化逻辑。
- **独立重置**：
  - **严禁**依赖其他测试的执行顺序。
  - 必须在 `beforeEach` 中重新创建 Mock 对象和 NestJS 的 `TestingModule`。
  - 必须在 `afterEach` 中清理全局状态（如环境变量、单例实例、定时器），防止测试间污染。

### 6. 依赖隔离与模拟 (Mocking)

- **零外部依赖**：单元测试**绝不**访问真实数据库、网络接口或文件系统。
- **全面 Mock**：
  - 使用 `jest.mock()`、`jest.spyOn()` 或手动创建桩（Stub）替代所有外部依赖。
  - 在 NestJS 中，利用 `@nestjs/testing` 创建 `TestingModule`，通过 `useValue` 提供模拟的 Service、Repository、Guard 等。
- **测试边界**：
  - 只测试当前单元的内部逻辑，不测试依赖库的行为（例如：不要测试 TypeORM 的 `save` 方法是否真的写入磁盘，只需测试 Service
    是否正确调用了 `save`）。
  - **验证交互**：检查模拟对象的方法是否被调用、调用次数及参数是否正确。
    ```typescript
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }));
    ```

### 7. 测试数据工厂 (Test Factories)

- **避免硬编码**：严禁在测试中硬编码完整的复杂对象字面量。
- **建立工厂函数**：对于复杂的 DTO、Entity 或 Input 对象，应建立 Test Factories（测试工厂函数）。
  - 工厂函数应接受部分字段作为参数，其余字段使用合理的默认值。
  - 示例：`createUserDto({ name: 'CustomName' })` 将生成一个包含默认 email、password 等字段的完整对象。

### 8. 异步测试规范

- **Async/Await**：所有涉及异步操作的测试必须使用 `async/await` 语法，禁止混用 `.then()` 回调。
- **异常捕获**：测试异常抛出时，**禁止**使用 `try/catch` 块包裹断言。
  - ✅ 推荐：`await expect(service.throwError()).rejects.toThrow('InvalidInputException');`
  - ❌ 禁止：
    ```typescript
    try {
      await service.throwError();
    } catch (e) {
      expect(e.message).toBe('...');
    }
    ```

### 9. 单元测试 vs E2E 测试策略

| 特性          | 单元测试 (Unit)                | 端到端测试 (E2E)                      |
|:------------|:---------------------------|:---------------------------------|
| **依赖程度**    | 0% 外部依赖，全 Mock             | 启动真实 NestJS 应用 (`app.init()`)    |
| **测试范围**    | 测逻辑分支、算法、转换                | 测 HTTP 请求、中间件、过滤器、真实 DB 交互       |
| **HTTP 模拟** | 直接调用 Service/Controller 方法 | 使用 `supertest` 发起真实 HTTP 请求      |
| **数据库策略**   | **严禁**连接数据库                | 可连接数据库，但必须使用**独立测试库**或**事务回滚**机制 |
| **数据清洁**    | 不涉及数据持久化                   | 测试结束后必须确保数据干净，严禁污染开发/生产数据        |

### 10. 工具与配置

- **测试运行器**：使用 Jest。
- **NestJS 测试模块**：
  ```typescript
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [UserService],
    })
    .overrideProvider(UserRepository)
    .useValue(mockRepo) // 关键：注入 Mock
    .compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(async () => {
    await module.close(); // 清理资源
  });
  ```

## 开发与构建

- 开发：`npm run start:dev`
- 生产：`npm run build` 后 `npm run start:prod`
- 规范：遵循 `eslint.config.mjs` 与 `.prettierrc`，环境变量参考 `.env.example`。

## 相关 AGENTS.md

- 源码根与各模块说明见：`src/AGENTS.md` 以及 `src` 下各模块目录中的 AGENTS.md。
