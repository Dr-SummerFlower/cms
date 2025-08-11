import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TokenResponse } from '../types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ValidationService } from './validation.service';

/**
 * 认证控制器
 * @class AuthController
 * @description 处理用户认证相关的HTTP请求，包括登录、注册和令牌刷新
 */
@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly validationService: ValidationService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '用户通过邮箱和密码登录系统，成功后返回JWT访问令牌',
  })
  @ApiBody({
    type: LoginDto,
    description: '登录信息',
    examples: {
      example1: {
        summary: '登录示例',
        value: {
          email: '3606006150@qq.com',
          password: '@Qwer123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT访问令牌',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT刷新令牌',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '请输入有效的邮箱地址' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/login' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '认证失败',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 401 },
        message: { type: 'string', example: '邮箱或密码错误' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/login' },
      },
    },
  })
  @HttpCode(200)
  /**
   * 用户登录接口
   * @param {LoginDto} loginDto - 登录数据传输对象
   * @returns {Promise<TokenResponse>} 登录成功后的令牌响应
   * @description 处理用户登录请求，验证邮箱和密码后返回JWT令牌
   */
  login(@Body() loginDto: LoginDto): Promise<TokenResponse> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({
    summary: '用户注册',
    description: '用户注册新账户，需要提供用户名、邮箱、密码和邮箱验证码',
  })
  @ApiBody({
    type: RegisterDto,
    description: '注册信息',
    examples: {
      example1: {
        summary: '注册示例',
        value: {
          username: 'summer',
          email: '3606006150@qq.com',
          password: '@Qwer123456',
          code: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 201 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT访问令牌',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT刷新令牌',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '请求参数错误或验证码无效',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '验证码错误或已过期',
        },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/register' },
      },
    },
  })
  @ApiConflictResponse({
    description: '用户已存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 409 },
        message: { type: 'string', example: '用户名或邮箱已存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/register' },
      },
    },
  })
  /**
   * 用户注册接口
   * @param {RegisterDto} registerDto - 注册数据传输对象
   * @returns {Promise<TokenResponse>} 注册成功后的令牌响应
   * @description 处理用户注册请求，验证邮箱验证码后创建新用户并返回JWT令牌
   */
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponse> {
    await this.validationService.validateCode(
      registerDto.email,
      registerDto.code,
      'register',
    );
    const result: TokenResponse = await this.authService.register({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
    });
    await this.validationService.clearCode(registerDto.email, 'register');
    return result;
  }

  @Post('refresh')
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用refresh token获取新的access token和refresh token',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh Token信息',
    examples: {
      example1: {
        summary: '刷新令牌示例',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: '新的JWT访问令牌',
            },
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: '新的JWT刷新令牌',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh Token无效或已过期',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 401 },
        message: { type: 'string', example: '无效的refresh token' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/refresh' },
      },
    },
  })
  @HttpCode(200)
  /**
   * 刷新访问令牌接口
   * @param {RefreshTokenDto} refreshTokenDto - 刷新令牌数据传输对象
   * @returns {Promise<TokenResponse>} 刷新成功后的新令牌响应
   * @description 使用refresh token获取新的access token和refresh token
   */
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }
}
