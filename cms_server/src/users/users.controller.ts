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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ValidationService } from '../auth/validation.service';
import { StoragesService } from '../storages/storages.service';
import { PaginationDto } from './dto/pagination.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('用户')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly validationService: ValidationService,
    private readonly storagesService: StoragesService,
  ) {}

  @ApiOperation({
    summary: '获取用户列表',
    description: '分页查询用户列表，可选关键词搜索',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词',
    example: 'admin',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            users: [
              {
                _id: '66c1234567890abcdef0123',
                username: 'admin',
                avatar:
                  'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
                email: 'admin@admin.com',
                role: 'ADMIN',
                createdAt: '2025-08-19T12:00:00.000Z',
                updatedAt: '2025-08-19T12:00:00.000Z',
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users',
        },
      },
    },
  })
  @Get()
  @Roles('ADMIN', 'INSPECTOR')
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<UserListResponseDto> {
    return await this.usersService.findAll(paginationDto);
  }

  @ApiOperation({
    summary: '获取用户详情',
    description: '根据ID获取单个用户信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    example: '66c1234567890abcdef0123',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0123',
            username: 'admin',
            avatar:
              'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
            email: 'admin@admin.com',
            role: 'ADMIN',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-19T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users/66c1234567890abcdef0123',
        },
      },
    },
  })
  @Get(':id')
  @Roles('ADMIN', 'INSPECTOR', 'USER')
  async findOne(@Param('id') id: string): Promise<User> {
    return await this.usersService.findOneById(id);
  }

  @ApiOperation({
    summary: '更新用户信息',
    description:
      '用户或管理员更新用户资料（更新邮箱需验证码，更新密码需旧密码验证）',
  })
  @ApiBody({
    description: '更新用户请求体',
    type: UpdateUserDto,
    examples: {
      updateUsername: {
        summary: '修改用户名',
        value: { username: 'new_name' },
      },
      updateEmail: {
        summary: '修改邮箱（需验证码）',
        value: { email: 'new_mail@example.com', emailCode: '123456' },
      },
      updatePassword: {
        summary: '修改密码（需旧密码验证）',
        value: { password: '@OldPassword123', newPassword: '@NewPassword123' },
      },
    },
  })
  @ApiOkResponse({
    description: '更新成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0123',
            username: 'new_name',
            avatar:
              'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
            email: 'admin@admin.com',
            role: 'ADMIN',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users/66c1234567890abcdef0123',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    example: '66c1234567890abcdef0123',
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

    // 只有邮箱更新需要验证码
    const needEmailVerification = updateData.email;

    if (needEmailVerification) {
      if (!emailCode) {
        throw new BadRequestException('更新邮箱需要提供验证码');
      }

      const currentUser: User = await this.usersService.findOneById(id);

      await this.validationService.validateCode(
        currentUser.email,
        emailCode,
        'update',
      );
    }

    const result = await this.usersService.update(id, updateData);

    if (needEmailVerification && emailCode) {
      await this.validationService.clearCode(result.email, 'update');
    }

    return result;
  }

  @ApiOperation({ summary: '更新用户权限', description: '管理员更新用户角色' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    example: '66c1234567890abcdef0123',
  })
  @ApiBody({
    description: '更新权限请求体',
    type: UpdateRoleDto,
    examples: {
      setAdmin: {
        summary: '设置为管理员',
        value: { role: 'ADMIN' },
      },
      setUser: {
        summary: '设置为普通用户',
        value: { role: 'USER' },
      },
    },
  })
  @ApiOkResponse({
    description: '更新成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0123',
            username: 'user001',
            avatar:
              'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
            email: 'user@user.com',
            role: 'ADMIN',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users/66c1234567890abcdef0123/role',
        },
      },
    },
  })
  @Patch(':id/role')
  @Roles('ADMIN')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<User> {
    return await this.usersService.updateRole(id, updateRoleDto.role);
  }

  @ApiOperation({ summary: '删除用户', description: '管理员删除用户' })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    example: '66c1234567890abcdef0123',
  })
  @ApiOkResponse({
    description: '删除成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: null,
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users/66c1234567890abcdef0123',
        },
      },
    },
  })
  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string): Promise<null> {
    return await this.usersService.remove(id);
  }

  @ApiOperation({
    summary: '上传用户头像',
    description: '用户或管理员上传头像',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
    example: '66c1234567890abcdef0123',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '头像上传请求体（multipart/form-data）',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
      required: ['avatar'],
    },
  })
  @ApiOkResponse({
    description: '上传成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0123',
            username: 'user001',
            avatar:
              'http://localhost:9000/assets/avatar/2025-08-19/2823d126-0441-4635-859f-9eee37a1c281.png',
            email: 'user@user.com',
            role: 'USER',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/users/66c1234567890abcdef0123/avatar',
        },
      },
    },
  })
  @Patch(':id/avatar')
  @Roles('USER', 'ADMIN')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() avatar: Express.Multer.File,
    @Request() req: { user: { userId: string; role: string } },
  ): Promise<User> {
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('无权修改该用户头像');
    }
    if (!avatar) throw new BadRequestException('缺少文件');
    const url: string = await this.storagesService.uploadFile(avatar, 'avatar');
    return await this.usersService.updateAvatar(id, url);
  }
}
