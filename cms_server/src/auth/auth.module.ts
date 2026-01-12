import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StoragesModule } from '../storages/storages.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { LoginLimitService } from './login-limit.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ValidationService } from './validation.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'qwerty'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
    forwardRef(() => UsersModule),
    StoragesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ValidationService,
    LoginLimitService,
    CaptchaService,
  ],
  exports: [AuthService, ValidationService],
})
export class AuthModule {}
