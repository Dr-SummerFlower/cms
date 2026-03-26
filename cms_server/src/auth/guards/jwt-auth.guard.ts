import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 基于 Passport JWT 策略的认证守卫。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
