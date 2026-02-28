import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/auth/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;
  let mockRequest: {
    user: Partial<{
      userId: string;
      username: string;
      avatar: string;
      email: string;
      role: string;
    }> | null;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    mockRequest = {
      user: null,
    };

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('当没有设置角色装饰器时，应返回 true', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('当用户为空时，应返回 false', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      mockRequest.user = null;

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('当用户角色匹配所需角色时，应返回 true', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['ADMIN', 'USER']);
      mockRequest.user = { role: 'USER' };

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('当用户角色不匹配所需角色时，应返回 false', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      mockRequest.user = { role: 'USER' };

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('当用户角色匹配多个所需角色中的任意一个时，应返回 true', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['ADMIN', 'MODERATOR']);
      mockRequest.user = { role: 'MODERATOR' };

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('当需要多个角色但用户角色不匹配任何一个时，应返回 false', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['ADMIN', 'MODERATOR']);
      mockRequest.user = { role: 'USER' };

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });
  });
});
