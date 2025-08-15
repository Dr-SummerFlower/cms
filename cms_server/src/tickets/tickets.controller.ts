import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
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
import {
  RefundRequest,
  TicketQRResponse,
  VerifyTicketResponse,
} from '../types';
import { AdminReviewRefundDto } from './dto/admin-review-refund.dto';
import { CreateTicketOrderDto } from './dto/create-ticket-order.dto';
import { RefundRequestQueryDto } from './dto/refund-request-query.dto';
import { RefundTicketDto } from './dto/refund-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { VerificationHistoryQueryDto } from './dto/verification-history-query.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { VerificationRecord } from './entities/verification-record.entity';
import { TicketsService } from './tickets.service';

/**
 * 票务控制器
 * @description 处理票务相关的HTTP请求，包括购票、查询、退票、生成二维码等API接口
 */
@ApiTags('票务管理')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * 创建票务订单
   * @description 用户购买演唱会门票，支持购买多种类型和数量的票
   * @param createTicketOrderDto 订单创建数据
   * @param req 请求对象，包含用户信息
   * @returns 返回创建的票务列表
   */
  @Post('orders')
  @Roles('USER', 'ADMIN')
  @ApiOperation({
    summary: '创建票务订单',
    description: '用户购买演唱会门票，支持购买多种类型和数量的票',
  })
  @ApiBody({
    type: CreateTicketOrderDto,
    description: '订单信息',
    examples: {
      example1: {
        summary: '购票示例',
        value: {
          concertId: '507f1f77bcf86cd799439011',
          tickets: [
            {
              type: 'adult',
              quantity: 2,
            },
            {
              type: 'child',
              quantity: 1,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '订单创建成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 201 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              concertId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
              type: { type: 'string', example: 'adult' },
              price: { type: 'number', example: 299 },
              status: { type: 'string', example: 'valid' },
              signature: { type: 'string', example: 'MEUCIQDxxx...' },
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
      },
    },
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '票数不足' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/tickets/orders' },
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
        path: { type: 'string', example: '/tickets/orders' },
      },
    },
  })
  async createOrder(
    @Body() createTicketOrderDto: CreateTicketOrderDto,
    @Request() req: { user: { userId: string } },
  ) {
    return await this.ticketsService.createOrder(
      createTicketOrderDto,
      req.user.userId,
    );
  }

  /**
   * 获取我的票务列表
   * @description 用户查询自己购买的所有票务，支持按状态筛选
   * @param queryDto 查询参数
   * @param req 请求对象，包含用户信息
   * @returns 返回用户的票务列表
   */
  @Get('my')
  @Roles('USER', 'ADMIN')
  @ApiOperation({
    summary: '获取我的票务列表',
    description: '用户查询自己购买的所有票务，支持按状态筛选',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['valid', 'used', 'refunded'],
    description: '票务状态',
    example: 'valid',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取票务列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              concertId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
              type: { type: 'string', example: 'adult' },
              price: { type: 'number', example: 299 },
              status: { type: 'string', example: 'valid' },
              signature: { type: 'string', example: 'MEUCIQDxxx...' },
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
      },
    },
  })
  async getMyTickets(
    @Query() queryDto: TicketQueryDto,
    @Request() req: { user: { userId: string } },
  ) {
    return await this.ticketsService.findMyTickets(req.user.userId, queryDto);
  }

  /**
   * 获取票务详情
   * @description 根据票务ID获取票务详细信息
   * @param ticketId 票务ID
   * @param req 请求对象，包含用户信息
   * @returns 返回票务详细信息
   */
  @Get(':id')
  @Roles('USER', 'ADMIN')
  @ApiOperation({
    summary: '获取票务详情',
    description: '根据票务ID获取票务详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '票务ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取票务详情',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            concertId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
            type: { type: 'string', example: 'adult' },
            price: { type: 'number', example: 299 },
            status: { type: 'string', example: 'valid' },
            signature: { type: 'string', example: 'MEUCIQDxxx...' },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '票务不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '票务不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/tickets/507f1f77bcf86cd799439012' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: '无权访问此票务',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: '无权访问此票务' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/tickets/507f1f77bcf86cd799439012' },
      },
    },
  })
  async getTicketDetail(
    @Param('id') ticketId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return await this.ticketsService.findOne(ticketId, req.user.userId);
  }

  /**
   * 申请退票
   * @description 用户申请退票，需要提供退票原因
   * @param ticketId 票务ID
   * @param refundDto 退票申请数据
   * @param req 请求对象，包含用户信息
   * @returns 返回退票后的票务信息
   */
  @Post(':id/refund')
  @Roles('USER', 'ADMIN')
  @ApiOperation({
    summary: '申请退票',
    description: '用户申请退票，提交退票申请等待管理员审核，需要提供退票原因',
  })
  @ApiParam({
    name: 'id',
    description: '票务ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({
    type: RefundTicketDto,
    description: '退票申请信息',
    examples: {
      example1: {
        summary: '退票申请示例',
        value: {
          reason: '临时有事无法参加',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '退票申请提交成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: {
              type: 'string',
              example: '退票申请已提交，请等待管理员审核',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '退票申请失败',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '票务已使用，无法申请退票' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/507f1f77bcf86cd799439012/refund',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '票务不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '票务不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/507f1f77bcf86cd799439012/refund',
        },
      },
    },
  })
  @HttpCode(200)
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

  /**
   * 生成票务二维码
   * @description 为有效票务生成二维码，用于入场验证
   * @param ticketId 票务ID
   * @param req 请求对象，包含用户信息
   * @returns 返回包含二维码的响应数据
   */
  @Get(':id/qr')
  @Roles('USER', 'ADMIN')
  @ApiOperation({
    summary: '生成票务二维码',
    description: '为有效票务生成二维码，用于入场验证',
  })
  @ApiParam({
    name: 'id',
    description: '票务ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiResponse({
    status: 200,
    description: '成功生成二维码',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            qrCode: {
              type: 'string',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            },
            ticketId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            signature: { type: 'string', example: 'MEUCIQDxxx...' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '无法生成二维码',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '票务状态无效，无法生成二维码' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/507f1f77bcf86cd799439012/qr',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '票务不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '票务不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/507f1f77bcf86cd799439012/qr',
        },
      },
    },
  })
  async generateQRCode(
    @Param('id') ticketId: string,
    @Request() req: { user: { userId: string } },
  ): Promise<TicketQRResponse> {
    return await this.ticketsService.generateQRCode(ticketId, req.user.userId);
  }

  /**
   * 获取退票申请列表
   * @description 管理员获取退票申请列表，支持按状态筛选
   * @param queryDto 查询参数
   * @returns 返回退票申请列表
   */
  @Get('refund-requests')
  @Roles('ADMIN')
  @ApiOperation({
    summary: '获取退票申请列表',
    description: '管理员获取退票申请列表，支持按状态筛选',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
    description: '申请状态',
    example: 'pending',
  })
  @ApiQuery({
    name: 'concertId',
    required: false,
    type: String,
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: '用户ID',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取退票申请列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ticketId: { type: 'string', example: '507f1f77bcf86cd799439012' },
              userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
              concertId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              reason: { type: 'string', example: '临时有事无法参加' },
              status: { type: 'string', example: 'pending' },
              requestTime: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              ticketInfo: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'adult' },
                  price: { type: 'number', example: 299 },
                  concertName: { type: 'string', example: '演唱会名称' },
                  venue: { type: 'string', example: '演出场地' },
                },
              },
              userInfo: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  username: { type: 'string', example: '用户名' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getRefundRequests(
    @Query() queryDto: RefundRequestQueryDto,
  ): Promise<RefundRequest[]> {
    return await this.ticketsService.getPendingRefundRequests(queryDto);
  }

  /**
   * 审核退票申请
   * @description 管理员审核退票申请，决定通过或拒绝
   * @param ticketId 票据ID
   * @param reviewDto 审核数据
   * @param req 请求对象，包含管理员信息
   * @returns 返回审核结果
   */
  @Put('refund-requests/:ticketId/review')
  @Roles('ADMIN')
  @ApiOperation({
    summary: '审核退票申请',
    description: '管理员审核退票申请，决定通过或拒绝',
  })
  @ApiParam({
    name: 'ticketId',
    description: '票据ID',
    example: '507f1f77bcf86cd799439012',
  })
  @ApiBody({
    type: AdminReviewRefundDto,
    description: '审核信息',
    examples: {
      approve: {
        summary: '通过申请示例',
        value: {
          approved: true,
          reviewNote: '符合退票条件，同意退票',
        },
      },
      reject: {
        summary: '拒绝申请示例',
        value: {
          approved: false,
          reviewNote: '不符合退票政策，拒绝退票',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '审核成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '退票申请已通过，票据已退款' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '审核失败',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '该申请已被处理' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/refund-requests/507f1f77bcf86cd799439012/review',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '退票申请不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '退票申请不存在或已过期' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: {
          type: 'string',
          example: '/tickets/refund-requests/507f1f77bcf86cd799439012/review',
        },
      },
    },
  })
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
}

/**
 * 票务验证控制器
 * @description 处理票务验证相关的HTTP请求，包括验票和查询验证历史等API接口
 */
@ApiTags('票务验证')
@ApiBearerAuth()
@Controller('verify')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerifyController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * 验证票务
   * @description 检票员验证票务的有效性和真实性
   * @param verifyDto 验证数据，包含票务ID和签名
   * @param req 请求对象，包含检票员信息
   * @returns 返回验证结果
   */
  @Post('ticket')
  @Roles('INSPECTOR', 'ADMIN')
  @ApiOperation({
    summary: '验证票务',
    description: '检票员验证票务的有效性和真实性',
  })
  @ApiBody({
    type: VerifyTicketDto,
    description: '验证信息',
    examples: {
      example1: {
        summary: '验票示例',
        value: {
          ticketId: '507f1f77bcf86cd799439012',
          signature: 'MEUCIQDxxx...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '验证成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', example: true },
            ticket: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                concertId: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439011',
                },
                userId: { type: 'string', example: '507f1f77bcf86cd799439013' },
                type: { type: 'string', example: 'adult' },
                price: { type: 'number', example: 299 },
                status: { type: 'string', example: 'used' },
              },
            },
            verificationRecord: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
                ticketId: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439012',
                },
                inspectorId: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439015',
                },
                verifiedAt: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
                result: { type: 'string', example: 'valid' },
              },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: '验证失败',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '票务签名无效' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/verify/ticket' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: '票务不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '票务不存在' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/verify/ticket' },
      },
    },
  })
  @HttpCode(200)
  async verifyTicket(
    @Body() verifyDto: VerifyTicketDto,
    @Request() req: { user: { userId: string } },
  ): Promise<VerifyTicketResponse> {
    return await this.ticketsService.verifyTicket(verifyDto, req.user.userId);
  }

  /**
   * 获取验证历史记录
   * @description 查询票务验证的历史记录，支持按时间范围和检票员筛选
   * @param queryDto 查询参数
   * @returns 返回验证历史记录列表
   */
  @Get('history')
  @Roles('INSPECTOR', 'ADMIN')
  @ApiOperation({
    summary: '获取验证历史记录',
    description: '查询票务验证的历史记录，支持按时间范围和检票员筛选',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期',
    example: '2024-01-31',
  })
  @ApiQuery({
    name: 'inspectorId',
    required: false,
    type: String,
    description: '检票员ID',
    example: '507f1f77bcf86cd799439015',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取验证历史记录',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
              ticketId: { type: 'string', example: '507f1f77bcf86cd799439012' },
              inspectorId: {
                type: 'string',
                example: '507f1f77bcf86cd799439015',
              },
              verifiedAt: {
                type: 'string',
                example: '2024-01-01T00:00:00.000Z',
              },
              result: { type: 'string', example: 'valid' },
              notes: { type: 'string', example: '验证成功' },
            },
          },
        },
      },
    },
  })
  async getVerificationHistory(
    @Query() queryDto: VerificationHistoryQueryDto,
  ): Promise<VerificationRecord[]> {
    return await this.ticketsService.getVerificationHistory(queryDto);
  }
}
