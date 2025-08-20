import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoragesService } from '../storages/storages.service';
import { AuthResponse, TokenResponse } from '../types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ValidationService } from './validation.service';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly validationService: ValidationService,
    private readonly storagesService: StoragesService,
  ) {}

  @ApiOperation({ summary: '用户登录', description: '使用邮箱和密码登录' })
  @ApiBody({
    description: '登录请求体',
    type: LoginDto,
    examples: {
      admin: {
        summary: '管理员登录',
        value: {
          email: 'admin@admin.com',
          password: '@Admin123456',
        },
      },
      user: {
        summary: '普通用户登录',
        value: {
          email: 'user@user.com',
          password: '@User123456',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '登录成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVF9SZWZyZXNo...',
            user: {
              userId: '66c1234567890abcdef0123',
              username: 'admin',
              avatar:
                'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
              email: 'admin@admin.com',
              role: 'ADMIN',
            },
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/auth/login',
        },
      },
    },
  })
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: '用户注册', description: '提交资料与头像注册账号' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '注册请求体（multipart/form-data）',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'user001' },
        email: { type: 'string', example: 'user@user.com' },
        password: { type: 'string', example: '@User123456' },
        code: { type: 'string', example: '123456' },
        avatar: { type: 'string', format: 'binary' },
      },
      required: ['username', 'email', 'password', 'code', 'avatar'],
    },
  })
  @ApiCreatedResponse({
    description: '注册成功',
    content: {
      'application/json': {
        example: {
          code: 201,
          message: 'success',
          data: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVF9SZWZyZXNo...',
            user: {
              userId: '66cabcdef01234567890abcd',
              username: 'user001',
              avatar:
                'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
              email: 'user@user.com',
              role: 'USER',
            },
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/auth/register',
        },
      },
    },
  })
  @Post('register')
  @UseInterceptors(FileInterceptor('avatar'))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() avatar: Express.Multer.File,
  ): Promise<AuthResponse> {
    await this.validationService.validateCode(
      registerDto.email,
      registerDto.code,
      'register',
    );
    const result: AuthResponse = await this.authService.register({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      avatar: await this.storagesService.uploadFile(avatar, 'avatar'),
    });
    await this.validationService.clearCode(registerDto.email, 'register');
    return result;
  }

  @ApiOperation({
    summary: '刷新令牌',
    description: '使用刷新令牌获取新的访问令牌',
  })
  @ApiBody({
    description: '刷新令牌请求体',
    type: RefreshTokenDto,
    examples: {
      default: {
        summary: '示例',
        value: {
          refresh_token: 'refresh_token_example',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '刷新成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            access_token: 'new_access_token_example',
            refresh_token: 'new_refresh_token_example',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/auth/refresh',
        },
      },
    },
  })
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
