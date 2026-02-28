/* eslint-disable @typescript-eslint/unbound-method */
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('应被正确定义', () => {
    expect(guard).toBeDefined();
  });

  it('应继承自 AuthGuard', () => {
    // Assert
    expect(guard.canActivate).toBeDefined();
    expect(guard.handleRequest).toBeDefined();
  });
});
