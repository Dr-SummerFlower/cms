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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly validationService: ValidationService,
  ) {}

  @Get()
  @Roles('ADMIN', 'INSPECTOR')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSPECTOR', 'USER')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

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

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
