import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StoragesService } from '../storages/storages.service';
import { ConcertsService } from './concerts.service';
import { ConcertListResponseDto } from './dto/concert-list-response.dto';
import { ConcertQueryDto } from './dto/concert-query.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { Concert } from './entities/concert.entity';

@ApiTags('演唱会')
@Controller('concerts')
export class ConcertsController {
  constructor(
    private readonly concertsService: ConcertsService,
    private storagesService: StoragesService,
  ) {}

  @ApiOperation({
    summary: '创建演唱会',
    description: '管理员创建演唱会并上传海报',
  })
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '创建演唱会请求体（multipart/form-data）',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '周杰伦2025世界巡回演唱会-北京站' },
        date: { type: 'string', example: '2025-09-01T19:30:00.000Z' },
        venue: { type: 'string', example: '北京国家体育场（鸟巢）' },
        adultPrice: { type: 'number', example: 680 },
        childPrice: { type: 'number', example: 380 },
        totalTickets: { type: 'number', example: 5000 },
        maxAdultTicketsPerUser: { type: 'number', example: 2 },
        maxChildTicketsPerUser: { type: 'number', example: 1 },
        description: {
          type: 'string',
          example: '本次巡演将带来全新曲目与经典回顾',
        },
        poster: { type: 'string', format: 'binary' },
      },
      required: [
        'name',
        'date',
        'venue',
        'adultPrice',
        'childPrice',
        'totalTickets',
        'poster',
      ],
    },
  })
  @ApiCreatedResponse({
    description: '创建成功',
    content: {
      'application/json': {
        example: {
          code: 201,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0456',
            name: '周杰伦2025世界巡回演唱会-北京站',
            poster:
              'http://localhost:9000/assets/poster/2025-08-19/2ff59634-8a9f-4b0a-abbe-f514b9e255a3.png',
            date: '2025-09-01T19:30:00.000Z',
            venue: '北京国家体育场（鸟巢）',
            adultPrice: 680,
            childPrice: 380,
            totalTickets: 5000,
            soldTickets: 0,
            maxAdultTicketsPerUser: 2,
            maxChildTicketsPerUser: 1,
            status: 'upcoming',
            description: '本次巡演将带来全新曲目与经典回顾',
            publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-19T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/concerts',
        },
      },
    },
  })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('poster'))
  async create(
    @Body() createConcertDto: CreateConcertDto,
    @UploadedFile() poster: Express.Multer.File,
  ): Promise<Concert> {
    return await this.concertsService.create(
      createConcertDto,
      await this.storagesService.uploadFile(poster, 'poster'),
    );
  }

  @ApiOperation({
    summary: '获取演唱会列表',
    description: '根据状态与关键词进行分页查询',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '状态筛选',
    example: 'upcoming',
    enum: ['upcoming', 'ongoing', 'completed'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '搜索关键词',
    example: '周杰伦',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            concerts: [
              {
                _id: '66c1234567890abcdef0456',
                name: '周杰伦2025世界巡回演唱会-北京站',
                poster:
                  'http://localhost:9000/assets/poster/2025-08-19/2ff59634-8a9f-4b0a-abbe-f514b9e255a3.png',
                date: '2025-09-01T19:30:00.000Z',
                venue: '北京国家体育场（鸟巢）',
                adultPrice: 680,
                childPrice: 380,
                totalTickets: 5000,
                soldTickets: 1200,
                maxAdultTicketsPerUser: 2,
                maxChildTicketsPerUser: 1,
                status: 'upcoming',
                description: '本次巡演将带来全新曲目与经典回顾',
                publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
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
          path: '/api/concerts',
        },
      },
    },
  })
  @Get()
  async findAll(
    @Query() queryDto: ConcertQueryDto,
  ): Promise<ConcertListResponseDto> {
    return await this.concertsService.findAll(queryDto);
  }

  @ApiOperation({
    summary: '获取演唱会详情',
    description: '根据ID获取演唱会详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66c1234567890abcdef0456',
            name: '周杰伦2025世界巡回演唱会-北京站',
            poster:
              'http://localhost:9000/assets/poster/2025-08-19/2ff59634-8a9f-4b0a-abbe-f514b9e255a3.png',
            date: '2025-09-01T19:30:00.000Z',
            venue: '北京国家体育场（鸟巢）',
            adultPrice: 680,
            childPrice: 380,
            totalTickets: 5000,
            soldTickets: 1200,
            maxAdultTicketsPerUser: 2,
            maxChildTicketsPerUser: 1,
            status: 'upcoming',
            description: '本次巡演将带来全新曲目与经典回顾',
            publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-19T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/concerts/66c1234567890abcdef0456',
        },
      },
    },
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Concert> {
    return await this.concertsService.findOne(id);
  }

  @ApiOperation({
    summary: '更新演唱会信息',
    description: '管理员更新演唱会基本信息',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiBearerAuth('bearer')
  @ApiBody({
    description: '更新演唱会请求体',
    type: UpdateConcertDto,
    examples: {
      updateVenue: {
        summary: '修改场馆',
        value: { venue: '上海梅赛德斯-奔驰文化中心' },
      },
      updatePrices: {
        summary: '修改票价',
        value: { adultPrice: 780, childPrice: 420 },
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
            _id: '66c1234567890abcdef0456',
            name: '周杰伦2025世界巡回演唱会-北京站',
            poster:
              'http://localhost:9000/assets/poster/2025-08-19/2ff59634-8a9f-4b0a-abbe-f514b9e255a3.png',
            date: '2025-09-01T19:30:00.000Z',
            venue: '上海梅赛德斯-奔驰文化中心',
            adultPrice: 780,
            childPrice: 420,
            totalTickets: 6000,
            soldTickets: 1200,
            maxAdultTicketsPerUser: 2,
            maxChildTicketsPerUser: 1,
            status: 'upcoming',
            description: '更新描述：新增嘉宾与特别环节',
            publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/concerts/66c1234567890abcdef0456',
        },
      },
    },
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateConcertDto: UpdateConcertDto,
  ): Promise<Concert> {
    return await this.concertsService.update(id, updateConcertDto);
  }

  @ApiOperation({ summary: '删除演唱会', description: '管理员删除演唱会' })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiBearerAuth('bearer')
  @ApiOkResponse({
    description: '删除成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: null,
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/concerts/66c1234567890abcdef0456',
        },
      },
    },
  })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string): Promise<null> {
    return await this.concertsService.remove(id);
  }

  @ApiOperation({
    summary: '上传/更新演唱会海报',
    description: '管理员上传或更新演唱会海报',
  })
  @ApiParam({
    name: 'id',
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '海报上传请求体（multipart/form-data）',
    schema: {
      type: 'object',
      properties: {
        poster: { type: 'string', format: 'binary' },
      },
      required: ['poster'],
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
            _id: '66c1234567890abcdef0456',
            name: '周杰伦2025世界巡回演唱会-北京站',
            poster:
              'http://localhost:9000/assets/poster/2025-08-19/2ff59634-8a9f-4b0a-abbe-f514b9e255a3.png',
            date: '2025-09-01T19:30:00.000Z',
            venue: '北京国家体育场（鸟巢）',
            adultPrice: 680,
            childPrice: 380,
            totalTickets: 5000,
            soldTickets: 1200,
            maxAdultTicketsPerUser: 2,
            maxChildTicketsPerUser: 1,
            status: 'upcoming',
            description: '本次巡演将带来全新曲目与经典回顾',
            publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
            createdAt: '2025-08-19T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/concerts/66c1234567890abcdef0456/poster',
        },
      },
    },
  })
  @Patch(':id/poster')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('poster'))
  async uploadPoster(
    @Param('id') id: string,
    @UploadedFile() poster: Express.Multer.File,
    @Request() req: { user: { userId: string; role: string } },
  ): Promise<Concert> {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('无权修改演唱会海报');
    }
    if (!poster) throw new BadRequestException('缺少文件');
    const url: string = await this.storagesService.uploadFile(poster, 'poster');
    return await this.concertsService.updatePoster(id, url);
  }
}
