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
   * @throws {BadRequestException} 当用户ID或演唱会ID格式无效、票数不足或订单数据无效时抛出
   * @throws {NotFoundException} 当演唱会不存在时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
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
      throw new InternalServerErrorException('创建票务订单时发生错误');
    }
  }

  /**
   * 查询用户的票据列表
   * @description 根据用户ID和查询条件获取用户的票据列表，支持按状态和演唱会筛选
   * @param userId 用户ID
   * @param queryDto 查询条件数据传输对象
   * @returns 返回用户的票据数组
   * @throws {BadRequestException} 当用户ID格式无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
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

  /**
   * 查询单个票据详情
   * @description 根据票据ID和用户ID获取票据详情，包含权限验证
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @returns 返回票据详情
   * @throws {BadRequestException} 当票据ID或用户ID格式无效时抛出
   * @throws {NotFoundException} 当票据不存在时抛出
   * @throws {ForbiddenException} 当用户无权访问该票据时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
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
   * 退票处理
   * @description 处理用户的退票请求，包括权限验证、状态检查和退票逻辑
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @param refundDto 退票数据传输对象
   * @returns 返回更新后的票据信息
   * @throws {BadRequestException} 当票据ID或用户ID格式无效、票据状态不允许退票或演唱会已开始时抛出
   * @throws {NotFoundException} 当票据不存在时抛出
   * @throws {ForbiddenException} 当用户无权操作该票据时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async refundTicket(
    ticketId: string,
    userId: string,
    refundDto: RefundTicketDto,
  ): Promise<Ticket> {
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

      if (!updatedTicket) {
        throw new InternalServerErrorException('退票操作失败');
      }

      await this.concertModel.findByIdAndUpdate(concert._id, {
        $inc: { soldTickets: -1 },
      });

      return updatedTicket;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('退票处理时发生错误');
    }
  }

  /**
   * 生成票据二维码
   * @description 为有效票据生成二维码图片和相关数据
   * @param ticketId 票据ID
   * @param userId 用户ID
   * @returns 返回二维码图片和解析后的数据
   * @throws {BadRequestException} 当票据状态不允许生成二维码或二维码数据无效时抛出
   * @throws {InternalServerErrorException} 当二维码生成失败时抛出
   */
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

      const qrData = this.ecdsaService.parseQRCodeData(ticket.qrCodeData);
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

  /**
   * 验证票据
   * @description 验证票据的有效性，包括二维码解析、数字签名验证和状态更新
   * @param verifyDto 验票数据传输对象
   * @param inspectorId 检票员ID
   * @returns 返回验票结果和票据信息
   * @throws {BadRequestException} 当二维码数据无效或检票员ID格式无效时抛出
   * @throws {NotFoundException} 当票据不存在时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
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
   * 获取验证历史记录
   * @description 根据查询条件获取票据验证的历史记录
   * @param queryDto 验证历史查询数据传输对象
   * @returns 返回验证记录数组
   * @throws {BadRequestException} 当查询参数格式无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
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
          populate: {
            path: 'concert',
            select: 'name date venue',
          },
        })
        .populate('inspector', 'username')
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
