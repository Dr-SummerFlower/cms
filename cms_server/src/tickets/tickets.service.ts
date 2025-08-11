import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as QRCode from 'qrcode';
import { Concert } from '../concerts/entities/concert.entity';
import { EcdsaService } from '../ecdsa/ecdsa.service';
import {
  TicketCreateData,
  TicketOrderItem,
  TicketQRResponse,
  TicketQueryFilter,
  VerificationRecordData,
  VerifyTicketResponse,
} from '../types';
import { User } from '../users/entities/user.entity';
import {
  CreateTicketOrderDto,
  TicketOrderItemDto,
} from './dto/create-ticket-order.dto';
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
 * 票务服务类
 * @description 处理票务相关的业务逻辑，包括订单创建、票据查询、退票、二维码生成和验票等功能
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
  ) {}

  /**
   * 创建票务订单
   * @description 为指定用户创建票务订单，包括验证演唱会信息、检查票数限制、生成票据等
   * @param createTicketOrderDto 订单创建数据传输对象
   * @param userId 用户ID
   * @returns 返回创建的票据数组
   * @throws {NotFoundException} 当演唱会不存在时抛出
   * @throws {BadRequestException} 当票数不足或订单数据无效时抛出
   */
  async createOrder(
    createTicketOrderDto: CreateTicketOrderDto,
    userId: string,
  ): Promise<Ticket[]> {
    const { concertId, tickets } = createTicketOrderDto;

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
  }

  /**
   * 查询用户的票据列表
   * @description 根据用户ID和查询条件获取用户的票据列表，支持按状态和演唱会筛选
   * @param userId 用户ID
   * @param queryDto 查询条件数据传输对象
   * @returns 返回用户的票据数组
   */
  async findMyTickets(
    userId: string,
    queryDto: TicketQueryDto,
  ): Promise<Ticket[]> {
    const filter: TicketQueryFilter = { user: userId };

    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    if (queryDto.concertId) {
      filter.concert = queryDto.concertId;
    }

    return (await this.ticketModel
      .find(filter)
      .populate('concert', 'name date venue')
      .sort({ createdAt: -1 })
      .exec()) as Ticket[];
  }

  /**
   * 查询单个票据详情
   * @description 根据票据ID和用户ID获取票据详情，包含权限验证
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @returns 返回票据详情
   * @throws {NotFoundException} 当票据不存在时抛出
   * @throws {ForbiddenException} 当用户无权访问该票据时抛出
   */
  async findOne(ticketId: string, userId: string): Promise<Ticket> {
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
  }

  /**
   * 退票处理
   * @description 处理用户的退票请求，包括权限验证、状态检查和退票逻辑
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @param refundDto 退票数据传输对象
   * @returns 返回更新后的票据信息
   * @throws {NotFoundException} 当票据不存在时抛出
   * @throws {ForbiddenException} 当用户无权操作该票据时抛出
   * @throws {BadRequestException} 当票据状态不允许退票或演唱会已开始时抛出
   */
  async refundTicket(
    ticketId: string,
    userId: string,
    refundDto: RefundTicketDto,
  ): Promise<Ticket> {
    const ticket: Ticket = (await this.ticketModel
      .findById(ticketId)
      .populate('concert')
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

    const updatedTicket: Ticket = (await this.ticketModel
      .findByIdAndUpdate(
        ticketId,
        {
          status: 'refunded',
          refundReason: refundDto.reason,
        },
        { new: true },
      )
      .populate('concert', 'name date venue')) as Ticket;

    await this.concertModel.findByIdAndUpdate(concert._id, {
      $inc: { soldTickets: -1 },
    });

    return updatedTicket;
  }

  /**
   * 生成票据二维码
   * @description 为有效票据生成二维码图片和相关数据
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @returns 返回二维码图片和解析后的数据
   * @throws {BadRequestException} 当票据状态不允许生成二维码或二维码数据无效时抛出
   */
  async generateQRCode(
    ticketId: string,
    userId: string,
  ): Promise<TicketQRResponse> {
    const ticket: Ticket = await this.findOne(ticketId, userId);

    if (ticket.status !== 'valid') {
      throw new BadRequestException('只能为有效票据生成二维码');
    }

    const qrCodeImage: string = await QRCode.toDataURL(ticket.qrCodeData);

    const qrData = this.ecdsaService.parseQRCodeData(ticket.qrCodeData);
    if (!qrData) {
      throw new BadRequestException('无效的二维码数据');
    }

    return {
      qrCode: qrCodeImage,
      data: qrData,
    };
  }

  /**
   * 验证票据
   * @description 验证票据的有效性，包括二维码解析、数字签名验证和状态更新
   * @param verifyDto 验票数据传输对象
   * @param inspectorId 检票员ID
   * @returns 返回验票结果和票据信息
   * @throws {BadRequestException} 当二维码数据无效时抛出
   * @throws {NotFoundException} 当票据不存在时抛出
   */
  async verifyTicket(
    verifyDto: VerifyTicketDto,
    inspectorId: string,
  ): Promise<VerifyTicketResponse> {
    const qrData = this.ecdsaService.parseQRCodeData(verifyDto.qrData);
    if (!qrData) {
      throw new BadRequestException('无效的二维码数据');
    }

    const ticket: Ticket = (await this.ticketModel
      .findOne({ qrCodeData: verifyDto.qrData })
      .populate('concert', 'name date publicKey')
      .populate('user', 'username')
      .exec()) as Ticket;

    if (!ticket) {
      throw new NotFoundException('票据不存在');
    }

    const concert: Concert = ticket.concert;
    const user: User = ticket.user;
    let valid: boolean = false;
    let verificationSignature: string = '';

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
        type: ticket.type,
        status: valid ? 'used' : ticket.status,
        userName: user.username,
      },
      verifiedAt: new Date(),
    };
  }

  /**
   * 获取验证历史记录
   * @description 根据查询条件获取票据验证的历史记录
   * @param queryDto 验证历史查询数据传输对象
   * @returns 返回验证记录数组
   */
  async getVerificationHistory(
    queryDto: VerificationHistoryQueryDto,
  ): Promise<VerificationRecord[]> {
    const filter: Record<string, unknown> = {};

    if (queryDto.concertId) {
      const tickets: Ticket[] = (await this.ticketModel
        .find({ concert: queryDto.concertId })
        .select('_id')
        .exec()) as Ticket[];
      const ticketIds: string[] = tickets.map((ticket: Ticket): string =>
        String(ticket._id),
      );
      filter.ticket = { $in: ticketIds };
    }

    if (queryDto.date) {
      const startDate: Date = new Date(queryDto.date);
      const endDate: Date = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.verifiedAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    return (await this.verificationRecordModel
      .find(filter)
      .populate({
        path: 'ticket',
        populate: {
          path: 'concert',
          select: 'name date venue',
        },
      })
      .populate('inspector', 'username')
      .sort({ verifiedAt: -1 })
      .exec()) as VerificationRecord[];
  }

  /**
   * 创建单个票据
   * @description 为指定演唱会和用户创建单个票据，包括生成数字签名和二维码数据
   * @param concert 演唱会信息
   * @param userId 用户ID
   * @param ticketItem 票据项目信息
   * @param timestamp 时间戳
   * @returns 返回票据创建数据
   * @private
   */
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

    // 检查私钥格式，如果包含冒号说明解密失败
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

  /**
   * 生成临时票据ID
   * @description 基于时间戳和随机字符串生成唯一的临时票据ID
   * @param timestamp 时间戳
   * @returns 返回生成的临时票据ID
   * @private
   */
  private generateTempTicketId(timestamp: number): string {
    const random: string = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `TEMP_${timestamp}_${random}`;
  }

  /**
   * 检查用户购买限制
   * @description 检查用户是否超过了演唱会设定的购买限制
   * @param userId 用户ID
   * @param concertId 演唱会ID
   * @param tickets 要购买的票务列表
   * @param concert 演唱会信息
   * @throws {BadRequestException} 当超过购买限制时抛出
   * @private
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
