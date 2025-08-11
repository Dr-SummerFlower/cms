import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConcertsService } from './concerts.service';
import { ConcertListResponseDto } from './dto/concert-list-response.dto';
import { ConcertQueryDto } from './dto/concert-query.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { Concert } from './entities/concert.entity';

/**
 * 演唱会控制器
 * @description 处理演唱会相关的HTTP请求，包括创建、查询、更新和删除演唱会的API接口
 */
@ApiTags('演唱会管理')
@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '创建演唱会',
    description: '管理员创建新的演唱会',
  })
  @ApiBody({
    type: CreateConcertDto,
    description: '演唱会信息',
    examples: {
      example1: {
        summary: '创建演唱会示例',
        value: {
          name: '周杰伦演唱会',
          date: '2024-12-31T20:00:00.000Z',
          venue: '北京鸟巢体育场',
          adultPrice: 299,
          childPrice: 199,
          totalTickets: 1000,
          description: '周杰伦2024世界巡回演唱会北京站',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '演唱会创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 201 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: '周杰伦演唱会' },
            date: { type: 'string', example: '2024-12-31T20:00:00.000Z' },
            venue: { type: 'string', example: '北京鸟巢体育场' },
            adultPrice: { type: 'number', example: 299 },
            childPrice: { type: 'number', example: 199 },
            totalTickets: { type: 'number', example: 1000 },
            soldTickets: { type: 'number', example: 0 },
            status: { type: 'string', example: 'upcoming' },
            description: {
              type: 'string',
              example: '周杰伦2024世界巡回演唱会北京站',
            },
            publicKey: {
              type: 'string',
              example: 'MFYwEAYHKoZIzj0CAQYFK4E...',
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
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
        message: { type: 'string', example: '演唱会名称不能为空' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/concerts' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '权限不足',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: '权限不足' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/concerts' },
      },
    },
  })
  /**
   * 创建演唱会接口
   * @description 管理员创建新的演唱会
   * @param createConcertDto 创建演唱会的数据传输对象
   * @returns 返回创建的演唱会信息
   */
  async create(@Body() createConcertDto: CreateConcertDto): Promise<Concert> {
    return await this.concertsService.create(createConcertDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取演唱会列表',
    description: '分页获取演唱会列表，支持按状态和名称搜索',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['upcoming', 'ongoing', 'completed'],
    description: '演唱会状态',
    example: 'upcoming',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '按名称搜索',
    example: '周杰伦',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: '成功获取演唱会列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            concerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  name: { type: 'string', example: '周杰伦演唱会' },
                  date: { type: 'string', example: '2024-12-31T20:00:00.000Z' },
                  venue: { type: 'string', example: '北京鸟巢体育场' },
                  adultPrice: { type: 'number', example: 299 },
                  childPrice: { type: 'number', example: 199 },
                  totalTickets: { type: 'number', example: 1000 },
                  soldTickets: { type: 'number', example: 0 },
                  status: { type: 'string', example: 'upcoming' },
                  description: {
                    type: 'string',
                    example: '周杰伦2024世界巡回演唱会北京站',
                  },
                  createdAt: {
                    type: 'string',
                    example: '2024-01-01T00:00:00.000Z',
                  },
                  updatedAt: {
                    type: 'string',
                    example: '2024-01-01T00:00:00.000Z',
                  },
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
  /**
   * 获取演唱会列表接口
   * @description 分页获取演唱会列表，支持按状态和名称搜索
   * @param queryDto 查询参数对象
   * @returns 返回包含演唱会列表和分页信息的响应对象
   */
  async findAll(
    @Query() queryDto: ConcertQueryDto,
  ): Promise<ConcertListResponseDto> {
    return await this.concertsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取演唱会详情',
    description: '根据ID获取演唱会详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取演唱会详情',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: '周杰伦演唱会' },
            date: { type: 'string', example: '2024-12-31T20:00:00.000Z' },
            venue: { type: 'string', example: '北京鸟巢体育场' },
            adultPrice: { type: 'number', example: 299 },
            childPrice: { type: 'number', example: 199 },
            totalTickets: { type: 'number', example: 1000 },
            soldTickets: { type: 'number', example: 0 },
            status: { type: 'string', example: 'upcoming' },
            description: {
              type: 'string',
              example: '周杰伦2024世界巡回演唱会北京站',
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '演唱会不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '演唱会不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  /**
   * 获取演唱会详情接口
   * @description 根据ID获取演唱会详细信息
   * @param id 演唱会的唯一标识符
   * @returns 返回演唱会详细信息
   */
  async findOne(@Param('id') id: string): Promise<Concert> {
    return await this.concertsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '更新演唱会信息',
    description: '管理员更新演唱会信息',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: UpdateConcertDto })
  @ApiResponse({
    status: 200,
    description: '演唱会更新成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: '周杰伦演唱会（已更新）' },
            date: { type: 'string', example: '2024-12-31T20:00:00.000Z' },
            venue: { type: 'string', example: '北京鸟巢体育场' },
            adultPrice: { type: 'number', example: 399 },
            childPrice: { type: 'number', example: 299 },
            totalTickets: { type: 'number', example: 1200 },
            soldTickets: { type: 'number', example: 50 },
            status: { type: 'string', example: 'upcoming' },
            description: {
              type: 'string',
              example: '周杰伦2024世界巡回演唱会北京站（更新版）',
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
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
        message: { type: 'string', example: '演唱会名称不能为空' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '演唱会不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '演唱会不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '权限不足',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: '权限不足' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  /**
   * 更新演唱会信息接口
   * @description 管理员更新演唱会信息
   * @param id 演唱会的唯一标识符
   * @param updateConcertDto 更新演唱会的数据传输对象
   * @returns 返回更新后的演唱会信息
   */
  async update(
    @Param('id') id: string,
    @Body() updateConcertDto: UpdateConcertDto,
  ): Promise<Concert> {
    return await this.concertsService.update(id, updateConcertDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '删除演唱会',
    description: '管理员删除演唱会',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: '演唱会删除成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: { type: 'null' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '演唱会不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '演唱会不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '权限不足',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: '权限不足' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/api/concerts/507f1f77bcf86cd799439011',
        },
      },
    },
  })
  /**
   * 删除演唱会接口
   * @description 管理员删除演唱会
   * @param id 演唱会的唯一标识符
   * @returns void
   */
  async remove(@Param('id') id: string): Promise<void> {
    return await this.concertsService.remove(id);
  }
}
