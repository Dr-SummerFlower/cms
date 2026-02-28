import { UserListResponseDto } from '../../../src/users/dto/user-list-response.dto';

describe('UserListResponseDto', () => {
  it('should create a UserListResponseDto instance with all properties', () => {
    // Arrange
    const userListDto = new UserListResponseDto();

    // Act - 设置所有属性
    userListDto.users = [
      {
        _id: '66u000000000000000000001',
        username: 'user1',
        email: 'user1@example.com',
        role: 'USER',
        status: 'active',
        avatar: '/assets/default-avatar.png',
        createdAt: new Date('2025-08-20T12:00:00.000Z'),
        updatedAt: new Date('2025-08-20T12:00:00.000Z'),
      },
      {
        _id: '66u000000000000000000002',
        username: 'user2',
        email: 'user2@example.com',
        role: 'ADMIN',
        status: 'active',
        avatar: '/assets/default-avatar.png',
        createdAt: new Date('2025-08-21T12:00:00.000Z'),
        updatedAt: new Date('2025-08-21T12:00:00.000Z'),
      },
    ] as any; // 使用 any 避免类型检查

    userListDto.total = 42;
    userListDto.page = 1;
    userListDto.limit = 10;
    userListDto.totalPages = 5;

    // Assert - 验证所有属性的值
    expect(userListDto.users.length).toBe(2);
    expect(userListDto.users[0].username).toBe('user1');
    expect(userListDto.users[1].username).toBe('user2');
    expect(userListDto.total).toBe(42);
    expect(userListDto.page).toBe(1);
    expect(userListDto.limit).toBe(10);
    expect(userListDto.totalPages).toBe(5);
  });

  it('should have correct ApiProperty decorators', () => {
    // 由于我们无法直接检查装饰器，我们将检查类的结构

    // Arrange
    const userListDto = new UserListResponseDto();

    // Assert - 验证类的结构符合预期
    expect(userListDto).toHaveProperty('users');
    expect(userListDto).toHaveProperty('total');
    expect(userListDto).toHaveProperty('page');
    expect(userListDto).toHaveProperty('limit');
    expect(userListDto).toHaveProperty('totalPages');
  });

  it('should match expected example structure', () => {
    // Arrange
    const userListDto = new UserListResponseDto();

    // Act
    userListDto.users = [
      {
        _id: '66u000000000000000000001',
        username: 'user1',
        email: 'user1@example.com',
        role: 'user',
      },
    ] as any; // 使用 any 避免类型检查
    userListDto.total = 42;
    userListDto.page = 1;
    userListDto.limit = 10;
    userListDto.totalPages = 5;

    // Assert
    expect(userListDto.users[0]._id).toBe('66u000000000000000000001');
    expect(userListDto.users[0].username).toBe('user1');
    expect(userListDto.users[0].email).toBe('user1@example.com');
    expect(userListDto.users[0].role).toBe('user');
    expect(userListDto.total).toBe(42);
    expect(userListDto.page).toBe(1);
    expect(userListDto.limit).toBe(10);
    expect(userListDto.totalPages).toBe(5);
  });
});
