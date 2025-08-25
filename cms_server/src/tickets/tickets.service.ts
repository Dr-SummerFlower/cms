import { InjectRedis, Redis } from '@nestjs-redis/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import { Concert } from '../concerts/entities/concert.entity';
import { EcdsaService } from '../ecdsa/ecdsa.service';
import { EmailService } from '../email/email.service';
import {
  RefundRequest,
  TicketCreateData,
  TicketOrderItem,
  TicketQRData,
  TicketQRResponse,
  TicketQueryFilter,
  VerificationRecordData,
  VerifyTicketResponse,
} from '../types';
import { User } from '../users/entities/user.entity';
import { AdminReviewRefundDto } from './dto/admin-review-refund.dto';
import {
  CreateTicketOrderDto,
  TicketOrderItemDto,
} from './dto/create-ticket-order.dto';
import { RefundRequestQueryDto } from './dto/refund-request-query.dto';
import { RefundTicketDto } from './dto/refund-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { VerificationHistoryQueryDto } from './dto/verification-history-query.dto';
import { VerifyTicketDto } from './dto/verify-ticket.dto';
import { Ticket, TicketDocument } from './entities/ticket.entity';
import {
  VerificationRecord,
  VerificationRecordDocument,
} from './entities/verification-record.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(VerificationRecord.name)
    private readonly verificationRecordModel: Model<VerificationRecordDocument>,
    @InjectModel(Concert.name)
    private readonly concertModel: Model<Concert>,
    private readonly ecdsaService: EcdsaService,
    private readonly emailService: EmailService,
    @InjectRedis() private readonly redisService: Redis,
  ) {}

  async createOrder(
    createTicketOrderDto: CreateTicketOrderDto,
    userId: string,
  ): Promise<Ticket[]> {
    try {
      const { concertId, tickets } = createTicketOrderDto;

      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      if (!concertId || !concertId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的演唱会ID格式');
      }

      const concert: Concert = (await this.concertModel
        .findById(concertId)
        .select('+privateKey')
        .exec()) as Concert;

      if (!concert) {
        throw new NotFoundException('演唱会不存在');
      }

      if (concert.status !== 'upcoming') {
        throw new BadRequestException('只能购买即将开始的演唱会票据');
      }

      const totalQuantity: number = tickets.reduce(
        (sum: number, ticket: TicketOrderItemDto): number =>
          sum + ticket.quantity,
        0,
      );

      if (totalQuantity <= 0) {
        throw new BadRequestException('票数必须大于0');
      }

      if (concert.soldTickets + totalQuantity > concert.totalTickets) {
        throw new BadRequestException('票数不足');
      }

      await this.checkUserPurchaseLimit(userId, concertId, tickets, concert);

      const createdTickets: Ticket[] = [];
      const timestamp: number = Date.now();

      for (const ticketItem of tickets) {
        for (let i: number = 0; i < ticketItem.quantity; i++) {
          const ticketData: TicketCreateData = this.createSingleTicket(
            concert,
            userId,
            ticketItem,
            timestamp + i,
          );
          const ticket: Ticket = (await this.ticketModel.create(
            ticketData,
          )) as Ticket;
          createdTickets.push(ticket);
        }
      }

      await this.concertModel.findByIdAndUpdate(concertId, {
        $inc: { soldTickets: totalQuantity },
      });

      return createdTickets;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.log(error);
      throw new InternalServerErrorException('创建票务订单时发生错误');
    }
  }

  async findMyTickets(
    userId: string,
    queryDto: TicketQueryDto,
  ): Promise<Ticket[]> {
    try {
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const filter: TicketQueryFilter = { user: userId };

      if (queryDto.status) {
        filter.status = queryDto.status;
      }

      if (queryDto.concertId) {
        if (!queryDto.concertId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new BadRequestException('无效的演唱会ID格式');
        }
        filter.concert = queryDto.concertId;
      }

      return (await this.ticketModel
        .find(filter)
        .populate('concert', 'name date venue')
        .sort({ createdAt: -1 })
        .exec()) as Ticket[];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户票据列表时发生错误');
    }
  }

  async findOne(ticketId: string, userId: string): Promise<Ticket> {
    try {
      if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的票据ID格式');
      }

      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const ticket: Ticket = (await this.ticketModel
        .findById(ticketId)
        .populate('concert', 'name date venue')
        .populate('user', 'username email')
        .exec()) as Ticket;

      if (!ticket) {
        throw new NotFoundException('票据不存在');
      }

      if (String(ticket.user._id) !== userId) {
        throw new ForbiddenException('无权访问此票据');
      }

      return ticket;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询票据详情时发生错误');
    }
  }

  async requestRefund(
    ticketId: string,
    userId: string,
    refundDto: RefundTicketDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的票据ID格式');
      }

      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const ticket: Ticket = (await this.ticketModel
        .findById(ticketId)
        .populate('concert')
        .populate('user')
        .exec()) as Ticket;

      if (!ticket) {
        throw new NotFoundException('票据不存在');
      }

      if (String(ticket.user._id) !== userId) {
        throw new ForbiddenException('无权操作此票据');
      }

      if (ticket.status !== 'valid') {
        throw new BadRequestException('只能退还有效状态的票据');
      }

      const concert: Concert = ticket.concert;
      if (new Date() >= concert.date) {
        throw new BadRequestException('演唱会已开始，无法退票');
      }

      const existingRequest: string | null = await this.redisService.get(
        `refund_request:${ticketId}`,
      );
      if (existingRequest) {
        throw new BadRequestException('该票据已有待审核的退票申请');
      }

      const refundRequest: RefundRequest = {
        ticketId,
        userId,
        concertId: String(concert._id),
        reason: refundDto.reason,
        status: 'pending',
        requestTime: new Date().toISOString(),
        ticketInfo: {
          type: ticket.type,
          price: ticket.price,
          concertName: concert.name,
          concertDate: concert.date,
          venue: concert.venue,
        },
        userInfo: {
          email: ticket.user.email,
          username: ticket.user.username,
        },
      };

      await this.redisService.setEx(
        `refund_request:${ticketId}`,
        60 * 60 * 24 * 30,
        JSON.stringify(refundRequest),
      );

      await this.redisService.lPush(
        'pending_refund_requests',
        `refund_request:${ticketId}`,
      );

      return {
        success: true,
        message: '退票申请已提交，请等待管理员审核',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('退票申请提交失败');
    }
  }

  async getPendingRefundRequests(
    queryDto: RefundRequestQueryDto,
  ): Promise<RefundRequest[]> {
    try {
      const { status = 'pending', concertId, userId } = queryDto;

      let requestKeys: string[] = [];

      if (status === 'pending') {
        requestKeys = await this.redisService.lRange(
          'pending_refund_requests',
          0,
          -1,
        );
      } else {
        const processedKeys: string[] = await this.redisService.lRange(
          `processed_refund_requests:${status}`,
          0,
          -1,
        );
        requestKeys = processedKeys;
      }

      const requests: RefundRequest[] = [];
      for (const key of requestKeys) {
        const requestData: string | null = await this.redisService.get(key);
        if (requestData) {
          const request: RefundRequest = JSON.parse(requestData);

          if (concertId && request.concertId !== concertId) continue;
          if (userId && request.userId !== userId) continue;

          requests.push(request);
        }
      }

      return requests.sort(
        (a: RefundRequest, b: RefundRequest): number =>
          new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime(),
      );
    } catch (error) {
      throw new InternalServerErrorException('获取退票申请列表失败');
    }
  }

  async reviewRefundRequest(
    ticketId: string,
    adminId: string,
    reviewDto: AdminReviewRefundDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const requestKey = `refund_request:${ticketId}`;
      const requestData: string | null =
        await this.redisService.get(requestKey);

      if (!requestData) {
        throw new NotFoundException('退票申请不存在或已过期');
      }

      const request: RefundRequest = JSON.parse(requestData);

      if (request.status !== 'pending') {
        throw new BadRequestException('该申请已被处理');
      }

      const { approved, reviewNote } = reviewDto;

      if (approved) {
        const ticket = (await this.ticketModel.findById(ticketId)) as Ticket;
        if (!ticket) {
          throw new NotFoundException('票据不存在');
        }

        if (ticket.status !== 'valid') {
          throw new BadRequestException('票据状态已变更，无法退票');
        }

        await this.ticketModel.findByIdAndUpdate(ticketId, {
          status: 'refunded',
          refundReason: request.reason,
        });

        await this.concertModel.findByIdAndUpdate(request.concertId, {
          $inc: { soldTickets: -1 },
        });

        request.status = 'approved';
        request.reviewTime = new Date().toISOString();
        request.reviewNote = reviewNote;
        request.adminId = adminId;

        await this.redisService.lRem('pending_refund_requests', 1, requestKey);

        await this.redisService.lPush(
          'processed_refund_requests:approved',
          requestKey,
        );

        return {
          success: true,
          message: '退票申请已通过，票据已退款',
        };
      } else {
        if (!reviewNote) {
          throw new BadRequestException('拒绝申请时必须提供审核备注');
        }

        request.status = 'rejected';
        request.reviewTime = new Date().toISOString();
        request.reviewNote = reviewNote;
        request.adminId = adminId;

        await this.redisService.lRem('pending_refund_requests', 1, requestKey);

        await this.redisService.lPush(
          'processed_refund_requests:rejected',
          requestKey,
        );

        try {
          await this.emailService.sendRefundRejectionNotice(
            request.userInfo.email,
            {
              username: request.userInfo.username,
              concertName: request.ticketInfo.concertName,
              reason: reviewNote,
            },
          );
        } catch (emailError) {
          console.error('发送退票拒绝邮件失败:', emailError);
        }

        return {
          success: true,
          message: '退票申请已拒绝，已通知用户',
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('审核退票申请失败');
    } finally {
      const requestKey = `refund_request:${ticketId}`;
      const requestData: string | null =
        await this.redisService.get(requestKey);
      if (requestData) {
        const request: RefundRequest = JSON.parse(requestData);
        await this.redisService.setEx(
          requestKey,
          30 * 24 * 60 * 60,
          JSON.stringify(request),
        );
      }
    }
  }

  async generateQRCode(
    ticketId: string,
    userId: string,
  ): Promise<TicketQRResponse> {
    try {
      const ticket: Ticket = await this.findOne(ticketId, userId);

      if (ticket.status !== 'valid') {
        throw new BadRequestException('只能为有效票据生成二维码');
      }

      const qrCodeImage: string = await QRCode.toDataURL(ticket.qrCodeData);

      const qrData: TicketQRData | null = this.ecdsaService.parseQRCodeData(
        ticket.qrCodeData,
      );
      if (!qrData) {
        throw new BadRequestException('无效的二维码数据');
      }

      return {
        qrCode: qrCodeImage,
        data: qrData,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('生成二维码时发生错误');
    }
  }

  async verifyTicket(
    verifyDto: VerifyTicketDto,
    inspectorId: string,
  ): Promise<VerifyTicketResponse> {
    try {
      if (!inspectorId || !inspectorId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的检票员ID格式');
      }

      const qrData = this.ecdsaService.parseQRCodeData(verifyDto.qrData);
      if (!qrData) {
        throw new BadRequestException('无效的二维码数据');
      }

      const ticket: Ticket = (await this.ticketModel
        .findOne({ qrCodeData: verifyDto.qrData })
        .populate('concert', 'name date venue adultPrice childPrice publicKey')
        .populate('user', 'username email')
        .exec()) as Ticket;

      if (!ticket) {
        throw new NotFoundException('票据不存在');
      }

      const concert: Concert = ticket.concert;
      const user: User = ticket.user;
      let valid: boolean = false;
      let verificationSignature: string = qrData.signature || 'N/A';

      if (ticket.status === 'valid') {
        const signatureData: string =
          this.ecdsaService.generateTicketSignatureData(
            qrData.ticketId,
            String(concert._id),
            String(user._id),
            qrData.timestamp,
          );

        valid = this.ecdsaService.verify(
          signatureData,
          qrData.signature,
          concert.publicKey,
        );

        verificationSignature = qrData.signature;

        if (valid) {
          await this.ticketModel.findByIdAndUpdate(ticket._id, {
            status: 'used',
          });
        }
      }

      const verificationData: VerificationRecordData = {
        ticket: String(ticket._id),
        inspector: inspectorId,
        location: verifyDto.location,
        result: valid,
        signature: verificationSignature,
      };

      await this.verificationRecordModel.create(verificationData);

      return {
        valid,
        ticket: {
          id: String(ticket._id),
          concertName: concert.name,
          concertDate: concert.date,
          concertVenue: concert.venue,
          type: ticket.type,
          price: ticket.price,
          status: valid ? 'used' : ticket.status,
          userName: user.username,
          userEmail: user.email,
        },
        verifiedAt: new Date(),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('验证票据时发生错误');
    }
  }

  async getVerificationHistory(
    queryDto: VerificationHistoryQueryDto,
  ): Promise<VerificationRecord[]> {
    try {
      const filter: Record<string, unknown> = {};

      if (queryDto.concertId) {
        if (!queryDto.concertId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new BadRequestException('无效的演唱会ID格式');
        }

        const tickets: Ticket[] = (await this.ticketModel
          .find({ concert: queryDto.concertId })
          .select('_id')
          .exec()) as Ticket[];
        const ticketIds: string[] = tickets.map((ticket: Ticket): string =>
          String(ticket._id),
        );
        filter.ticket = { $in: ticketIds };
      }

      if (queryDto.startDate || queryDto.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (queryDto.startDate) {
          const startDate = new Date(queryDto.startDate);
          if (isNaN(startDate.getTime())) {
            throw new BadRequestException('无效的开始日期格式');
          }
          dateFilter.$gte = startDate;
        }
        if (queryDto.endDate) {
          const endDate: Date = new Date(queryDto.endDate);
          if (isNaN(endDate.getTime())) {
            throw new BadRequestException('无效的结束日期格式');
          }
          endDate.setDate(endDate.getDate() + 1);
          dateFilter.$lt = endDate;
        }
        filter.verifiedAt = dateFilter;
      }

      if (queryDto.inspectorId) {
        if (!queryDto.inspectorId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new BadRequestException('无效的检票员ID格式');
        }
        filter.inspector = queryDto.inspectorId;
      }

      return (await this.verificationRecordModel
        .find(filter)
        .populate({
          path: 'ticket',
          select: '_id type price status user concert',
          populate: [
            {
              path: 'concert',
              select: '_id name date venue adultPrice childPrice',
            },
            {
              path: 'user',
              select: '_id username email',
            },
          ],
        })
        .populate('inspector', 'username email')
        .sort({ verifiedAt: -1 })
        .exec()) as VerificationRecord[];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('获取验证历史记录时发生错误');
    }
  }

  private createSingleTicket(
    concert: Concert,
    userId: string,
    ticketItem: TicketOrderItem,
    timestamp: number,
  ): TicketCreateData {
    const tempTicketId: string = this.generateTempTicketId(timestamp);

    const signatureData: string = this.ecdsaService.generateTicketSignatureData(
      tempTicketId,
      String(concert._id),
      userId,
      timestamp,
    );

    if (concert.privateKey.includes(':')) {
      throw new BadRequestException('私钥解密失败，请检查环境配置');
    }

    const { signature }: { signature: string } = this.ecdsaService.sign(
      signatureData,
      concert.privateKey,
    );

    const qrCodeData: string = this.ecdsaService.generateQRCodeData(
      tempTicketId,
      signature,
      timestamp,
    );

    const price: number =
      ticketItem.type === 'adult' ? concert.adultPrice : concert.childPrice;

    return {
      concert: String(concert._id),
      user: userId,
      type: ticketItem.type,
      price,
      signature,
      publicKey: concert.publicKey,
      qrCodeData,
    };
  }

  private generateTempTicketId(timestamp: number): string {
    const random: string = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `TEMP_${timestamp}_${random}`;
  }

  private async checkUserPurchaseLimit(
    userId: string,
    concertId: string,
    tickets: TicketOrderItemDto[],
    concert: Concert,
  ): Promise<void> {
    const existingTickets: Ticket[] = (await this.ticketModel
      .find({
        user: userId,
        concert: concertId,
        status: { $in: ['valid', 'used'] },
      })
      .exec()) as Ticket[];

    const existingAdultTickets: number = existingTickets.filter(
      (ticket: Ticket): boolean => ticket.type === 'adult',
    ).length;
    const existingChildTickets: number = existingTickets.filter(
      (ticket: Ticket): boolean => ticket.type === 'child',
    ).length;

    const requestedAdultTickets: number =
      tickets.find((t: TicketOrderItemDto): boolean => t.type === 'adult')
        ?.quantity || 0;
    const requestedChildTickets: number =
      tickets.find((t: TicketOrderItemDto): boolean => t.type === 'child')
        ?.quantity || 0;

    if (
      existingAdultTickets + requestedAdultTickets >
      concert.maxAdultTicketsPerUser
    ) {
      throw new BadRequestException(
        `每个用户最多只能购买${concert.maxAdultTicketsPerUser}张成人票，您已购买${existingAdultTickets}张，本次申请${requestedAdultTickets}张，超出限制`,
      );
    }

    if (
      existingChildTickets + requestedChildTickets >
      concert.maxChildTicketsPerUser
    ) {
      throw new BadRequestException(
        `每个用户最多只能购买${concert.maxChildTicketsPerUser}张儿童票，您已购买${existingChildTickets}张，本次申请${requestedChildTickets}张，超出限制`,
      );
    }
  }
}
