import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
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
import {
  RefundRequest,
  TicketQRResponse,
  VerifyTicketResponse,
} from '../types';
import { AdminReviewRefundDto } from './dto/admin-review-refund.dto';
import { ConfirmVerificationDto } from './dto/confirm-verification.dto';
import { CreateTicketOrderDto } from './dto/create-ticket-order.dto';
import { RefundRequestQueryDto } from './dto/refund-request-query.dto';
import { RefundTicketDto } from './dto/refund-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { VerificationHistoryQueryDto } from './dto/verification-history-query.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { VerificationRecord } from './entities/verification-record.entity';
import { TicketsService } from './tickets.service';

@ApiTags('票务')
@ApiBearerAuth('bearer')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({ summary: '创建票务订单' })
  @ApiBody({
    description: '创建订单请求体',
    type: CreateTicketOrderDto,
    examples: {
      mix: {
        summary: '成人+儿童组合',
        value: {
          concertId: '66c1234567890abcdef0456',
          tickets: [
            { type: 'adult', quantity: 2 },
            { type: 'child', quantity: 1 },
          ],
        },
      },
      adultOnly: {
        summary: '仅成人票',
        value: {
          concertId: '66c1234567890abcdef0456',
          tickets: [{ type: 'adult', quantity: 1 }],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: '创建成功',
    content: {
      'application/json': {
        example: {
          code: 201,
          message: 'success',
          data: [
            {
              _id: '66d111111111111111111111',
              concert: '66c1234567890abcdef0456',
              user: '66u000000000000000000001',
              type: 'adult',
              price: 680,
              status: 'valid',
              signature: '3045022100abc123...',
              publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
              qrCodeData:
                '{"ticketId":"66d111111111111111111111","signature":"3045022100abc123...","timestamp":1724155200000}',
              createdAt: '2025-08-20T12:00:00.000Z',
              updatedAt: '2025-08-20T12:00:00.000Z',
            },
            {
              _id: '66d111111111111111111112',
              concert: '66c1234567890abcdef0456',
              user: '66u000000000000000000001',
              type: 'child',
              price: 380,
              status: 'valid',
              signature: '3045022100def456...',
              publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
              qrCodeData:
                '{"ticketId":"66d111111111111111111112","signature":"3045022100def456...","timestamp":1724155200001}',
              createdAt: '2025-08-20T12:00:00.000Z',
              updatedAt: '2025-08-20T12:00:00.000Z',
            },
          ],
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/orders',
        },
      },
    },
  })
  @Post('orders')
  @Roles('USER', 'ADMIN')
  @UseInterceptors(FilesInterceptor('faceImages'))
  async createOrder(
    @Body() body: { data?: string } & Partial<CreateTicketOrderDto>,
    @UploadedFiles() faceImages: Express.Multer.File[],
    @Request() req: { user: { userId: string } },
  ) {
    let createTicketOrderDto: CreateTicketOrderDto;

    // 如果 body 中有 data 字段（JSON 字符串），则解析它
    if (body.data && typeof body.data === 'string') {
      try {
        createTicketOrderDto = JSON.parse(body.data) as CreateTicketOrderDto;
      } catch {
        throw new BadRequestException('无效的订单数据格式');
      }
    } else {
      // 否则直接使用 body（兼容直接发送 JSON 的情况）
      createTicketOrderDto = body as CreateTicketOrderDto;
    }

    return await this.ticketsService.createOrder(
      createTicketOrderDto,
      req.user.userId,
      faceImages || [],
    );
  }

  @ApiOperation({ summary: '获取我的票据列表' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '票据状态',
    enum: ['valid', 'used', 'refunded'],
    example: 'valid',
  })
  @ApiQuery({
    name: 'concertId',
    required: false,
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
          data: [
            {
              _id: '66d111111111111111111111',
              concert: {
                _id: '66c1234567890abcdef0456',
                name: '周杰伦2025世界巡回演唱会-北京站',
                date: '2025-09-01T19:30:00.000Z',
                venue: '北京国家体育场（鸟巢）',
              },
              user: '66u000000000000000000001',
              type: 'adult',
              price: 680,
              status: 'valid',
              signature: '3045022100abc123...',
              publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
              qrCodeData:
                '{"ticketId":"66d111111111111111111111","signature":"3045022100abc123...","timestamp":1724155200000}',
              createdAt: '2025-08-20T12:00:00.000Z',
              updatedAt: '2025-08-20T12:00:00.000Z',
            },
          ],
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/my',
        },
      },
    },
  })
  @Get('my')
  @Roles('USER', 'ADMIN')
  async getMyTickets(
    @Query() queryDto: TicketQueryDto,
    @Request() req: { user: { userId: string } },
  ) {
    return await this.ticketsService.findMyTickets(req.user.userId, queryDto);
  }

  @ApiOperation({ summary: '获取退票申请列表' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '申请状态',
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  @ApiQuery({
    name: 'concertId',
    required: false,
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: '用户ID',
    example: '66u000000000000000000001',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: [
            {
              ticketId: '66d111111111111111111111',
              userId: '66u000000000000000000001',
              concertId: '66c1234567890abcdef0456',
              reason: '临时有事无法参加',
              status: 'pending',
              requestTime: '2025-08-20T12:00:00.000Z',
              ticketInfo: {
                type: 'adult',
                price: 680,
                concertName: '周杰伦2025世界巡回演唱会-北京站',
                concertDate: '2025-09-01T19:30:00.000Z',
                venue: '北京国家体育场（鸟巢）',
              },
              userInfo: {
                email: 'user@user.com',
                username: '普通用户',
              },
            },
          ],
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/refund-requests',
        },
      },
    },
  })
  @Get('refund-requests')
  @Roles('ADMIN')
  async getRefundRequests(
    @Query() queryDto: RefundRequestQueryDto,
  ): Promise<RefundRequest[]> {
    return await this.ticketsService.getPendingRefundRequests(queryDto);
  }

  @ApiOperation({ summary: '管理员审核退票申请' })
  @ApiParam({
    name: 'ticketId',
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @ApiBody({
    description: '审核请求体',
    type: AdminReviewRefundDto,
    examples: {
      approve: {
        summary: '同意',
        value: { approved: true, reviewNote: '同意退款' },
      },
      reject: {
        summary: '拒绝',
        value: { approved: false, reviewNote: '不满足退款条件' },
      },
    },
  })
  @ApiOkResponse({
    description: '审核成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: { success: true, message: '退票申请已通过，票据已退款' },
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/refund-requests/66d111111111111111111111/review',
        },
      },
    },
  })
  @Put('refund-requests/:ticketId/review')
  @Roles('ADMIN')
  @HttpCode(200)
  async reviewRefundRequest(
    @Param('ticketId') ticketId: string,
    @Body() reviewDto: AdminReviewRefundDto,
    @Request() req: { user: { userId: string } },
  ): Promise<{ success: boolean; message: string }> {
    return await this.ticketsService.reviewRefundRequest(
      ticketId,
      req.user.userId,
      reviewDto,
    );
  }

  @ApiOperation({ summary: '获取票据详情' })
  @ApiParam({
    name: 'id',
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            _id: '66d111111111111111111111',
            concert: {
              _id: '66c1234567890abcdef0456',
              name: '周杰伦2025世界巡回演唱会-北京站',
              date: '2025-09-01T19:30:00.000Z',
              venue: '北京国家体育场（鸟巢）',
            },
            user: {
              _id: '66u000000000000000000001',
              username: '普通用户',
              email: 'user@user.com',
            },
            type: 'adult',
            price: 680,
            status: 'valid',
            signature: '3045022100abc123...',
            publicKey: '-----BEGIN PUBLIC KEY-----MIIBIjANBgkqh...',
            qrCodeData:
              '{"ticketId":"66d111111111111111111111","signature":"3045022100abc123...","timestamp":1724155200000}',
            createdAt: '2025-08-20T12:00:00.000Z',
            updatedAt: '2025-08-20T12:00:00.000Z',
          },
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/66d111111111111111111111',
        },
      },
    },
  })
  @Get(':id')
  @Roles('USER', 'ADMIN')
  async getTicketDetail(
    @Param('id') ticketId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return await this.ticketsService.findOne(ticketId, req.user.userId);
  }

  @ApiOperation({ summary: '提交退票申请' })
  @ApiParam({
    name: 'id',
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @ApiBody({
    description: '退票申请请求体',
    type: RefundTicketDto,
    examples: {
      default: {
        summary: '退票原因示例',
        value: { reason: '临时有事无法参加' },
      },
    },
  })
  @ApiCreatedResponse({
    description: '提交成功',
    content: {
      'application/json': {
        example: {
          code: 201,
          message: 'success',
          data: {
            success: true,
            message: '退票申请已提交，请等待管理员审核',
          },
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/66d111111111111111111111/refund',
        },
      },
    },
  })
  @Post(':id/refund')
  @Roles('USER', 'ADMIN')
  @HttpCode(201)
  async requestRefund(
    @Param('id') ticketId: string,
    @Body() refundDto: RefundTicketDto,
    @Request() req: { user: { userId: string } },
  ): Promise<{ success: boolean; message: string }> {
    return await this.ticketsService.requestRefund(
      ticketId,
      req.user.userId,
      refundDto,
    );
  }

  @ApiOperation({ summary: '生成票据二维码' })
  @ApiParam({
    name: 'id',
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @ApiQuery({
    name: 'timestamp',
    required: false,
    description: '时间戳',
    example: '1724155200000',
  })
  @ApiOkResponse({
    description: '生成成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            data: {
              ticketId: '66d111111111111111111111',
              signature: '3045022100abc123...',
              timestamp: 1724155200000,
            },
            refreshInterval: 30000,
            nextRefreshTime: 1724155230000,
          },
          timestamp: '2025-08-20T12:00:00.000Z',
          path: '/api/tickets/66d111111111111111111111/qr',
        },
      },
    },
  })
  @Get(':id/qr')
  @Roles('USER', 'ADMIN')
  async generateQRCode(
    @Param('id') ticketId: string,
    @Request() req: { user: { userId: string } },
    @Query('timestamp') timestamp?: string,
  ): Promise<TicketQRResponse> {
    const timestampNumber: number | undefined = timestamp
      ? parseInt(timestamp, 10)
      : undefined;
    return await this.ticketsService.generateQRCode(
      ticketId,
      req.user.userId,
      timestampNumber,
    );
  }
}

@ApiTags('验票')
@ApiBearerAuth('bearer')
@Controller('verify')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerifyController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiOperation({ summary: '验票' })
  @ApiBody({
    description: '验票请求体',
    type: VerifyTicketDto,
    examples: {
      default: {
        summary: '扫码验票',
        value: {
          qrData:
            'eyJ0aWNrZXRJZCI6IjY2ZDExMTExMTExMTExMTExMTExMTExMSIsInNpZ25hdHVyZSI6IjMwNDUwMjIxMDBhYmMxMjMiLCJ0aW1lc3RhbXAiOjE3MjQxNTUyMDAwfQ==',
          location: '北京国家体育场 检票口A',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '验票成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            valid: true,
            ticket: {
              id: '66d111111111111111111111',
              concertName: '周杰伦2025世界巡回演唱会-北京站',
              concertDate: '2025-09-01T19:30:00.000Z',
              concertVenue: '北京国家体育场（鸟巢）',
              type: 'adult',
              price: 680,
              status: 'used',
              userName: '普通用户',
              userEmail: 'user@example.com',
            },
            verifiedAt: '2025-08-20T12:05:00.000Z',
          },
          timestamp: '2025-08-20T12:05:00.000Z',
          path: '/api/verify/ticket',
        },
      },
    },
  })
  @Post('ticket')
  @Roles('INSPECTOR', 'ADMIN')
  @HttpCode(200)
  async verifyTicket(
    @Body() verifyDto: VerifyTicketDto,
    @Request() req: { user: { userId: string } },
  ): Promise<VerifyTicketResponse> {
    return await this.ticketsService.verifyTicket(verifyDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取验票记录' })
  @ApiQuery({
    name: 'concertId',
    required: false,
    description: '演唱会ID',
    example: '66c1234567890abcdef0456',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '开始日期(ISO字符串)',
    example: '2025-08-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '结束日期(ISO字符串)',
    example: '2025-08-31T23:59:59.000Z',
  })
  @ApiQuery({
    name: 'inspectorId',
    required: false,
    description: '检票员ID',
    example: '66i000000000000000000001',
  })
  @ApiOkResponse({
    description: '获取成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: [
            {
              _id: '66v111111111111111111111',
              ticket: {
                _id: '66d111111111111111111111',
                type: 'adult',
                price: 680,
                status: 'used',
                concert: {
                  _id: '66c1234567890abcdef0456',
                  name: '周杰伦2025世界巡回演唱会-北京站',
                  date: '2025-09-01T19:30:00.000Z',
                  venue: '北京国家体育场（鸟巢）',
                  adultPrice: 680,
                  childPrice: 380,
                },
                user: {
                  _id: '66u000000000000000000001',
                  username: '普通用户',
                  email: 'user@example.com',
                },
              },
              inspector: {
                _id: '66i000000000000000000001',
                username: '检票员张三',
                email: 'inspector@example.com',
              },
              location: '北京国家体育场 检票口A',
              verifiedAt: '2025-08-20T12:05:00.000Z',
              signature: '3045022100abc123...',
              result: true,
              createdAt: '2025-08-20T12:05:10.000Z',
              updatedAt: '2025-08-20T12:05:10.000Z',
            },
          ],
          timestamp: '2025-08-20T12:05:10.000Z',
          path: '/api/verify/history',
        },
      },
    },
  })
  @Get('history')
  @Roles('INSPECTOR', 'ADMIN')
  async getVerificationHistory(
    @Query() queryDto: VerificationHistoryQueryDto,
  ): Promise<VerificationRecord[]> {
    return await this.ticketsService.getVerificationHistory(queryDto);
  }

  @ApiOperation({ summary: '手动确认验票' })
  @ApiBody({
    description: '确认验票请求体',
    type: ConfirmVerificationDto,
  })
  @ApiOkResponse({
    description: '确认成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: {
            success: true,
            message: '验票确认成功',
          },
          timestamp: '2025-08-20T12:05:00.000Z',
          path: '/api/verify/confirm',
        },
      },
    },
  })
  @Post('confirm')
  @Roles('INSPECTOR', 'ADMIN')
  @HttpCode(200)
  async confirmVerification(
    @Body() confirmDto: ConfirmVerificationDto,
    @Request() req: { user: { userId: string } },
  ): Promise<{ success: boolean; message: string }> {
    return await this.ticketsService.confirmVerification(
      confirmDto.ticketId,
      req.user.userId,
    );
  }
}
