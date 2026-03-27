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
import { StoragesService } from '../storages/storages.service';
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

/**
 * 负责购票下单、退票审核、二维码生成与验票记录管理的服务。
 */
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
    private readonly storagesService: StoragesService,
    @InjectRedis() private readonly redisService: Redis,
  ) {}

  /**
   * 创建票务订单并为每张票生成签名数据。
   *
   * @param createTicketOrderDto - 下单请求参数
   * @param userId - 当前购票用户 ID
   * @param faceImages - 与实名购票人一一对应的人脸图片
   * @returns 创建成功的票据列表
   * @throws BadRequestException 当参数、库存、实名信息或购票限制不合法时抛出
   * @throws NotFoundException 当演唱会不存在时抛出
   */
  async createOrder(
    createTicketOrderDto: CreateTicketOrderDto,
    userId: string,
    faceImages: Express.Multer.File[],
  ): Promise<Ticket[]> {
    try {
      const { concertId, tickets } = createTicketOrderDto;

      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      if (!concertId || !concertId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的演唱会ID格式');
      }

      // 购票时必须同时读取演唱会私钥，后续每张票都要基于它生成签名。
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

      // 先做总库存判断，避免后续上传图片和生成票据后才发现库存不足。
      if (concert.soldTickets + totalQuantity > concert.totalTickets) {
        throw new BadRequestException('票数不足');
      }

      // 实名制购票要求“人数、实名信息、人脸图像”三者数量完全一致。
      const totalAttendees = tickets.reduce(
        (sum: number, ticket: TicketOrderItemDto): number =>
          sum + (ticket.attendees?.length || 0),
        0,
      );

      if (totalAttendees !== totalQuantity) {
        throw new BadRequestException(
          `实名信息数量不匹配：需要 ${totalQuantity} 条，实际提供 ${totalAttendees} 条`,
        );
      }

      if ((faceImages?.length || 0) !== totalQuantity) {
        throw new BadRequestException(
          `人脸图像数量不匹配：需要 ${totalQuantity} 张，实际上传 ${faceImages?.length || 0} 张`,
        );
      }

      // 单用户限购在库存检查后执行，防止同一账号超额囤票。
      await this.checkUserPurchaseLimit(userId, concertId, tickets, concert);

      const createdTickets: Ticket[] = [];
      const timestamp: number = Date.now();
      let imageIndex: number = 0;

      // 先统一上传人脸图像，再按购票顺序逐张绑定到具体票据。
      const faceImageUrls: string[] = [];
      for (const faceImage of faceImages) {
        const url: string = await this.storagesService.uploadFile(
          faceImage,
          'face',
        );
        faceImageUrls.push(url);
      }

      for (const ticketItem of tickets) {
        for (let i: number = 0; i < ticketItem.quantity; i++) {
          const attendee = ticketItem.attendees[i];
          if (!attendee) {
            throw new BadRequestException(
              `缺少第 ${imageIndex + 1} 张票的实名信息`,
            );
          }

          // 每张票都单独绑定实名信息、人脸图像、签名与二维码原文。
          const ticketData: TicketCreateData = this.createSingleTicket(
            concert,
            userId,
            ticketItem,
            timestamp + imageIndex,
            attendee.realName,
            attendee.idCard,
            faceImageUrls[imageIndex],
          );
          const ticket: Ticket = (await this.ticketModel.create(
            ticketData,
          )) as Ticket;
          createdTickets.push(ticket);
          imageIndex++;
        }
      }

      // 全部票据创建成功后，再统一回写演唱会已售数量。
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
      throw new InternalServerErrorException('创建票务订单时发生错误');
    }
  }

  /**
   * 查询当前用户的票据列表。
   *
   * @param userId - 当前用户 ID
   * @param queryDto - 票据筛选条件
   * @returns 符合条件的票据列表
   * @throws BadRequestException 当查询参数不合法时抛出
   */
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
        // 票夹页常见筛选维度：有效、已使用、已退款等。
        filter.status = queryDto.status;
      }

      if (queryDto.concertId) {
        if (!queryDto.concertId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new BadRequestException('无效的演唱会ID格式');
        }
        // 允许只查看某一场演唱会下的个人票据。
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

  /**
   * 查询当前用户的一张票据详情。
   *
   * @param ticketId - 票据 ID
   * @param userId - 当前用户 ID
   * @returns 票据详情
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当票据不存在时抛出
   * @throws ForbiddenException 当票据不属于当前用户时抛出
   */
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
        // 电子票详情只允许持票人本人访问，避免票据内容泄露。
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

  /**
   * 提交退票申请并写入待审核队列。
   *
   * @param ticketId - 票据 ID
   * @param userId - 当前用户 ID
   * @param refundDto - 退票原因
   * @returns 提交结果
   * @throws BadRequestException 当票据状态不允许退票或已有待审核申请时抛出
   * @throws NotFoundException 当票据不存在时抛出
   * @throws ForbiddenException 当票据不属于当前用户时抛出
   */
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
      // 开场后不允许退票，避免演出进行中或结束后再回滚订单。
      if (new Date() >= concert.date) {
        throw new BadRequestException('演唱会已开始，无法退票');
      }

      const existingRequest: string | null = await this.redisService.get(
        `refund_request:${ticketId}`,
      );
      if (existingRequest) {
        throw new BadRequestException('该票据已有待审核的退票申请');
      }

      // 这里把审核页展示需要的票据与用户摘要一起打包，减少后台审核时的额外查询。
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

      // 退票申请在 Redis 中保留一段时间，便于管理员审核与历史追溯。
      await this.redisService.setEx(
        `refund_request:${ticketId}`,
        60 * 60 * 24 * 30,
        JSON.stringify(refundRequest),
      );

      await this.redisService.lPush(
        'pending_refund_requests',
        `refund_request:${ticketId}`,
      );

      // 进入待审核队列后，由管理员在后台决定通过或拒绝。
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

  /**
   * 查询待处理或已处理的退票申请列表。
   *
   * @param queryDto - 退票申请筛选条件
   * @returns 按申请时间倒序排列的退票申请列表
   */
  async getPendingRefundRequests(
    queryDto: RefundRequestQueryDto,
  ): Promise<RefundRequest[]> {
    try {
      const { status = 'pending', concertId, userId } = queryDto;

      let requestKeys: string[] = [];

      if (status === 'pending') {
        // 待处理申请和已处理申请使用不同 Redis 列表，便于后台按状态切换。
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

  /**
   * 审核指定票据的退票申请。
   *
   * @param ticketId - 票据 ID
   * @param adminId - 审核管理员 ID
   * @param reviewDto - 审核决定与备注
   * @returns 审核结果
   * @throws BadRequestException 当申请已处理或审核参数不合法时抛出
   * @throws NotFoundException 当退票申请或票据不存在时抛出
   */
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

        // 审核通过时，票据状态与演唱会库存都要同步回滚。
        await this.ticketModel.findByIdAndUpdate(ticketId, {
          status: 'refunded',
          refundReason: request.reason,
        });

        await this.concertModel.findByIdAndUpdate(request.concertId, {
          $inc: { soldTickets: -1 },
        });

        // 审核通过后将申请从待处理列表移至已处理列表。
        request.status = 'approved';
        request.reviewTime = new Date().toISOString();
        request.reviewNote = reviewNote;
        request.adminId = adminId;

        await this.redisService.lRem('pending_refund_requests', 1, requestKey);

        await this.redisService.lPush(
          'processed_refund_requests:approved',
          requestKey,
        );

        // 通过后无需发邮件，前端和后台历史都能直接看到状态变化。
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
          // 拒绝时主动通知用户，避免用户只能靠刷新后台状态获知结果。
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
        // 已处理申请继续保留一段时间，便于后台查看审核历史。
        await this.redisService.setEx(
          requestKey,
          30 * 24 * 60 * 60,
          JSON.stringify(request),
        );
      }
    }
  }

  /**
   * 为票据生成动态二维码。
   *
   * @param ticketId - 票据 ID
   * @param userId - 当前用户 ID
   * @param timestamp - 可选的指定时间戳
   * @returns 二维码图片与刷新信息
   * @throws BadRequestException 当二维码数据无效时抛出
   * @throws NotFoundException 当票据或演唱会不存在时抛出
   * @throws ForbiddenException 当票据不属于当前用户时抛出
   */
  async generateQRCode(
    ticketId: string,
    userId: string,
    timestamp?: number,
  ): Promise<TicketQRResponse> {
    try {
      const ticket: Ticket = await this.findOne(ticketId, userId);

      // 允许所有状态的票据生成二维码，包括已使用的票据
      // if (ticket.status !== 'valid') {
      //   throw new BadRequestException('只能为有效票据生成二维码');
      // }

      const currentTime: number = Date.now();
      const dynamicTimestamp: number =
        timestamp || this.generateDynamicTimestamp(currentTime);

      // 生成二维码时需要读取演唱会私钥重新签名，保证二维码具备时效性。
      const concert: Concert = (await this.concertModel
        .findById(ticket.concert)
        .select('+privateKey')
        .exec()) as Concert;

      if (!concert) {
        throw new NotFoundException('演唱会不存在');
      }

      const signatureData: string =
        this.ecdsaService.generateTicketSignatureData(
          ticketId,
          String(concert._id),
          userId,
          dynamicTimestamp,
        );

      const { signature }: { signature: string } = this.ecdsaService.sign(
        signatureData,
        concert.privateKey,
      );

      const dynamicQrCodeData: string = this.ecdsaService.generateQRCodeData(
        ticketId,
        signature,
        dynamicTimestamp,
      );

      // 前端展示的是二维码图片，但验票真正依赖的是其中的 JSON 原文。
      const qrCodeImage: string = await QRCode.toDataURL(dynamicQrCodeData);

      const qrData: TicketQRData | null =
        this.ecdsaService.parseQRCodeData(dynamicQrCodeData);
      if (!qrData) {
        throw new BadRequestException('无效的二维码数据');
      }

      const refreshInterval: number = 30000;
      // 返回下一次刷新时间，便于前端提前更新动态二维码。
      const nextRefreshTime: number = this.getNextRefreshTime(
        dynamicTimestamp,
        refreshInterval,
      );

      return {
        qrCode: qrCodeImage,
        data: qrData,
        refreshInterval,
        nextRefreshTime,
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

  /**
   * 校验票据二维码并记录一次验票行为。
   *
   * @param verifyDto - 验票请求参数
   * @param inspectorId - 当前检票员 ID
   * @returns 验票结果与票据展示信息
   * @throws BadRequestException 当二维码过期或数据无效时抛出
   * @throws NotFoundException 当票据不存在时抛出
   */
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
        .findById(qrData.ticketId)
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
      let requiresManualVerification: boolean = false;

      if (ticket.status === 'valid') {
        const currentTime: number = Date.now();
        const timestampAge: number = currentTime - qrData.timestamp;
        const maxAge: number = 60000;

        // 仅接受一分钟内生成的动态二维码，降低截图复用风险。
        if (timestampAge > maxAge) {
          throw new BadRequestException('二维码已过期，请刷新后重试');
        }

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

        // 如果票带有实名信息，就进入“验签通过但需人工复核”的状态。
        if (valid && (ticket.realName || ticket.idCard || ticket.faceImage)) {
          requiresManualVerification = true;
        } else if (valid) {
          // 非实名票在验签通过后即可直接核销。
          await this.ticketModel.findByIdAndUpdate(ticket._id, {
            status: 'used',
          });
        }
      }

      // 先落库验票记录，实名票等待后续人工确认后再更新最终结果。
      const verificationData: VerificationRecordData = {
        ticket: String(ticket._id),
        inspector: inspectorId,
        location: verifyDto.location,
        result: valid && !requiresManualVerification,
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
          status: valid && !requiresManualVerification ? 'used' : ticket.status,
          userName: user.username,
          userEmail: user.email,
          realName: ticket.realName,
          idCard: ticket.idCard,
          faceImage: ticket.faceImage,
        },
        verifiedAt: new Date(),
        requiresManualVerification,
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

  /**
   * 对需要人工确认的票据完成最终验票确认。
   *
   * @param ticketId - 票据 ID
   * @param inspectorId - 当前检票员 ID
   * @returns 确认结果
   * @throws BadRequestException 当票据状态不允许确认时抛出
   * @throws NotFoundException 当票据不存在时抛出
   */
  async confirmVerification(
    ticketId: string,
    inspectorId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的票据ID格式');
      }

      if (!inspectorId || !inspectorId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的检票员ID格式');
      }

      const ticket: Ticket = (await this.ticketModel
        .findById(ticketId)
        .exec()) as Ticket;

      if (!ticket) {
        throw new NotFoundException('票据不存在');
      }

      if (ticket.status !== 'valid') {
        throw new BadRequestException('只能确认有效状态的票据');
      }

      // 人工确认通过后，才真正将实名票据标记为已使用。
      await this.ticketModel.findByIdAndUpdate(ticketId, {
        status: 'used',
      });

      // 更新同一检票员最近一次验票记录，保留完整确认链路。
      const latestRecord = await this.verificationRecordModel
        .findOne({
          ticket: ticketId,
          inspector: inspectorId,
        })
        .sort({ createdAt: -1 })
        .exec();

      if (latestRecord) {
        await this.verificationRecordModel.findByIdAndUpdate(latestRecord._id, {
          result: true,
        });
      }

      return {
        success: true,
        message: '验票确认成功',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('确认验票时发生错误');
    }
  }

  /**
   * 查询验票历史记录。
   *
   * @param queryDto - 历史记录筛选条件
   * @returns 验票记录列表
   * @throws BadRequestException 当查询参数不合法时抛出
   */
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
          // 开始时间按当天起始时刻纳入查询范围。
          dateFilter.$gte = startDate;
        }
        if (queryDto.endDate) {
          const endDate: Date = new Date(queryDto.endDate);
          if (isNaN(endDate.getTime())) {
            throw new BadRequestException('无效的结束日期格式');
          }
          // 结束时间向后推一天，便于以前端“按天筛选”的方式包含整日数据。
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

  /**
   * 根据演唱会信息与实名信息构造单张票据数据。
   *
   * @param concert - 所属演唱会
   * @param userId - 购票用户 ID
   * @param ticketItem - 当前票据下单项
   * @param timestamp - 当前票据签名时间戳
   * @param realName - 购票实名
   * @param idCard - 购票身份证号
   * @param faceImage - 人脸图片地址
   * @returns 可直接写入数据库的票据数据
   */
  private createSingleTicket(
    concert: Concert,
    userId: string,
    ticketItem: TicketOrderItem,
    timestamp: number,
    realName: string,
    idCard: string,
    faceImage: string,
  ): TicketCreateData {
    const tempTicketId: string = this.generateTempTicketId(timestamp);

    // 票据落库前先使用临时 ID 参与签名，后续验票时以二维码原文为准校验。
    const signatureData: string = this.ecdsaService.generateTicketSignatureData(
      tempTicketId,
      String(concert._id),
      userId,
      timestamp,
    );

    if (concert.privateKey.includes(':')) {
      throw new BadRequestException('私钥解密失败，请检查环境配置');
    }

    // 票据落库前先完成签名，后续验票时以二维码原文和公钥进行反向校验。
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
      realName,
      idCard,
      faceImage,
    };
  }

  /**
   * 生成用于二维码签名的临时票据标识。
   *
   * @param timestamp - 当前签名时间戳
   * @returns 含时间戳与随机片段的临时票据 ID
   */
  private generateTempTicketId(timestamp: number): string {
    const random: string = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `TEMP_${timestamp}_${random}`;
  }

  /**
   * 校验用户在单场演唱会下的购票数量限制。
   *
   * @param userId - 当前用户 ID
   * @param concertId - 演唱会 ID
   * @param tickets - 本次下单的票据列表
   * @param concert - 演唱会配置
   * @returns 校验通过时不返回内容
   * @throws BadRequestException 当超出购票上限时抛出
   */
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

    // 成人票和儿童票分开统计，分别对应各自的单用户限购上限。
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

  /**
   * 根据当前时间生成二维码刷新周期内的动态时间戳。
   *
   * @param currentTime - 当前毫秒时间戳
   * @returns 对齐到刷新周期边界的时间戳
   */
  private generateDynamicTimestamp(currentTime: number): number {
    const refreshInterval: number = 30000;
    // 将时间对齐到固定刷新窗口，确保同一时段内生成的二维码时间戳一致。
    return Math.floor(currentTime / refreshInterval) * refreshInterval;
  }

  /**
   * 计算二维码下一次需要刷新的时间点。
   *
   * @param currentTimestamp - 当前二维码使用的时间戳
   * @param refreshInterval - 刷新间隔
   * @returns 下一次刷新时间戳
   */
  private getNextRefreshTime(
    currentTimestamp: number,
    refreshInterval: number,
  ): number {
    return currentTimestamp + refreshInterval;
  }
}
