import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ValidationService } from '../auth/validation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserListResponseDto } from './dto/user-list-response.dto';

@ApiTags('用户管理')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly validationService: ValidationService,
  ) {}

  @ApiOperation({ summary: '获取用户列表', description: '分页获取用户列表，支持搜索' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词（用户名或邮箱）', example: 'test' })
  @ApiResponse({
    status: 200,
    description: '成功获取用户列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  username: { type: 'string', example: 'summer' },
                  email: { type: 'string', example: 'test@example.com' },
                  role: { type: 'string', example: 'USER' },
                  createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                  updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                },
              },
            },
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '权限不足',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users' },
      },
    },
  })
  @Get()
  @Roles('ADMIN', 'INSPECTOR')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @ApiOperation({ summary: '获取用户详情', description: '根据用户ID获取用户详细信息' })
  @ApiParam({ name: 'id', description: '用户ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({
    status: 200,
    description: '成功获取用户详情',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'summer' },
            email: { type: 'string', example: 'test@example.com' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '用户不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011' },
      },
    },
  })
  @Get(':id')
  @Roles('ADMIN', 'INSPECTOR', 'USER')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @ApiOperation({ summary: '更新用户信息', description: '更新用户的基本信息，如用户名、邮箱、密码等' })
  @ApiParam({ name: 'id', description: '用户ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: '成功更新用户信息',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'newusername' },
            email: { type: 'string', example: 'newemail@example.com' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '用户名至少4个字符' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '用户不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011' },
      },
    },
  })
  @Patch(':id')
  @Roles('ADMIN', 'USER')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: { userId: string; role: string } },
  ): Promise<User> {
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      throw new ForbiddenException('您只能修改自己的信息');
    }
    const { emailCode, ...updateData } = updateUserDto;

    const needVerification = updateData.email || updateData.password;

    if (needVerification) {
      if (!emailCode) {
        throw new BadRequestException('更新邮箱或密码需要提供验证码');
      }

      const currentUser = await this.usersService.findOneById(id);

      await this.validationService.validateCode(
        currentUser.email,
        emailCode,
        'update',
      );
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const result = await this.usersService.update(id, updateData);

    if (needVerification && emailCode) {
      await this.validationService.clearCode(result.email, 'update');
    }

    return result;
  }

  @ApiOperation({ summary: '更新用户角色', description: '管理员更新用户的角色权限' })
  @ApiParam({ name: 'id', description: '用户ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: '成功更新用户角色',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'summer' },
            email: { type: 'string', example: 'test@example.com' },
            role: { type: 'string', example: 'ADMIN' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '权限必须是 GUEST、USER、ADMIN 或 INSPECTOR 之一' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011/role' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '用户不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011/role' },
      },
    },
  })
  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @ApiOperation({ summary: '删除用户', description: '管理员删除指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({
    status: 200,
    description: '成功删除用户',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'summer' },
            email: { type: 'string', example: 'test@example.com' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '用户不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/users/507f1f77bcf86cd799439011' },
      },
    },
  })
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
