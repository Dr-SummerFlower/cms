import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EcdsaService } from '../ecdsa/ecdsa.service';
import { Ticket, TicketDocument } from '../tickets/entities/ticket.entity';
import { ConcertQueryFilter, ConcertsReminder, EcdsaKeyPair } from '../types';
import { ConcertListResponseDto } from './dto/concert-list-response.dto';
import { ConcertQueryDto } from './dto/concert-query.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { Concert, ConcertDocument } from './entities/concert.entity';

/**
 * 负责演唱会数据管理、状态维护与提醒查询的服务。
 */
@Injectable()
export class ConcertsService {
  private readonly logger = new Logger(ConcertsService.name);

  constructor(
    @InjectModel(Concert.name)
    private readonly concertModel: Model<ConcertDocument>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly ecdsaService: EcdsaService,
  ) {}

  /**
   * 创建演唱会并为其生成专属 ECDSA 密钥对。
   *
   * @param createConcertDto - 演唱会创建参数
   * @param poster - 演唱会海报地址
   * @returns 新创建的演唱会实体
   * @throws BadRequestException 当数据校验失败或名称重复时抛出
   */
  async create(
    createConcertDto: CreateConcertDto,
    poster: string,
  ): Promise<Concert> {
    try {
      const keyPair: EcdsaKeyPair = this.ecdsaService.generateKeyPair();

      // 每场演唱会独立生成密钥对，供后续票据签名与验签使用。
      const concertData = {
        ...createConcertDto,
        poster,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
      };

      const savedConcert: Concert = (await this.concertModel.create(
        concertData,
      )) as Concert;

      const result: Concert = (await this.concertModel
        .findById(savedConcert._id)
        .exec()) as Concert;
      if (!result) {
        throw new InternalServerErrorException('演唱会创建失败');
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { name?: string; code?: number };
      if (err.name === 'ValidationError') {
        throw new BadRequestException('演唱会数据验证失败');
      }
      if (err.code === 11000) {
        throw new BadRequestException('演唱会名称已存在');
      }
      this.logger.error(`创建演唱会时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('创建演唱会时发生错误');
    }
  }

  /**
   * 按条件分页查询演唱会列表。
   *
   * @param queryDto - 列表查询参数
   * @returns 包含分页信息的演唱会列表结果
   * @throws BadRequestException 当分页参数超出允许范围时抛出
   */
  async findAll(queryDto: ConcertQueryDto): Promise<ConcertListResponseDto> {
    try {
      const { status, search, page = 1, limit = 10 } = queryDto;

      // 列表页允许分页，但限制单次读取量，避免一次性返回过多演唱会数据。
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException(
          '页码和每页数量必须为正数，且每页数量不能超过100',
        );
      }

      const skip: number = (page - 1) * limit;

      const filter: ConcertQueryFilter = {};
      if (status) {
        // 对应前端的状态切换：即将开始 / 进行中 / 已结束。
        filter.status = status;
      }
      if (search) {
        // 首页搜索框按演唱会名称做模糊匹配。
        filter.name = { $regex: search, $options: 'i' };
      }

      const [concerts, total]: [Concert[], number] = await Promise.all([
        // 默认按开演时间升序返回，前端可直接展示最近场次。
        this.concertModel
          .find(filter)
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.concertModel.countDocuments(filter).exec(),
      ]);

      const totalPages: number = Math.ceil(total / limit);

      return {
        concerts,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`获取演唱会列表时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('获取演唱会列表时发生错误');
    }
  }

  /**
   * 根据 ID 查询单场演唱会详情。
   *
   * @param id - 演唱会 ID
   * @returns 对应的演唱会实体
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当演唱会不存在时抛出
   */
  async findOne(id: string): Promise<Concert> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的演唱会ID格式');
      }

      const concert: Concert = (await this.concertModel
        .findById(id)
        .exec()) as Concert;
      if (!concert) {
        throw new NotFoundException('演唱会不存在');
      }
      return concert;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`查询演唱会详情时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('查询演唱会详情时发生错误');
    }
  }

  /**
   * 更新指定演唱会的信息。
   *
   * @param id - 演唱会 ID
   * @param updateConcertDto - 允许更新的演唱会字段
   * @returns 更新后的演唱会实体
   * @throws BadRequestException 当 ID 格式无效、数据非法或名称重复时抛出
   * @throws NotFoundException 当演唱会不存在时抛出
   */
  async update(
    id: string,
    updateConcertDto: UpdateConcertDto,
  ): Promise<Concert> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的演唱会ID格式');
      }

      const concert: Concert = (await this.concertModel
        .findByIdAndUpdate(id, updateConcertDto, { new: true })
        .exec()) as Concert;
      if (!concert) {
        throw new NotFoundException('演唱会不存在');
      }
      // 更新后再查询一次，确保返回结果与默认查询字段保持一致。
      const result: Concert = (await this.concertModel
        .findById(concert._id)
        .exec()) as Concert;
      if (!result) {
        throw new InternalServerErrorException('更新的演唱会未找到');
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { name?: string; code?: number };
      if (err.name === 'ValidationError') {
        throw new BadRequestException('演唱会数据验证失败');
      }
      if (err.code === 11000) {
        throw new BadRequestException('演唱会名称已存在');
      }
      this.logger.error(`更新演唱会时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('更新演唱会时发生错误');
    }
  }

  /**
   * 删除指定演唱会。
   *
   * @param id - 演唱会 ID
   * @returns 删除成功时返回 `null`
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当演唱会不存在时抛出
   */
  async remove(id: string): Promise<null> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的演唱会ID格式');
      }

      const result: Concert = (await this.concertModel
        .findByIdAndDelete(id)
        .exec()) as Concert;
      if (!result) {
        throw new NotFoundException('演唱会不存在');
      }
      // 删除后返回 null，前端据此刷新管理列表即可。
      return null;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`删除演唱会时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('删除演唱会时发生错误');
    }
  }

  /**
   * 根据当前时间批量更新演唱会状态。
   *
   * @returns 更新完成时不返回内容
   */
  async updateConcertStatuses(): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 开场后 24 小时内的演唱会视为进行中，超出后统一标记为已结束。
      await this.concertModel
        .updateMany(
          {
            date: { $lte: now, $gt: oneDayAgo },
            status: 'upcoming',
          },
          { $set: { status: 'ongoing' } },
        )
        .exec();

      await this.concertModel
        .updateMany(
          {
            date: { $lte: oneDayAgo },
            status: { $in: ['upcoming', 'ongoing'] },
          },
          { $set: { status: 'completed' } },
        )
        .exec();

      this.logger.log('演唱会状态更新完成');
    } catch (error) {
      this.logger.error(
        `更新演唱会状态失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `更新演唱会状态失败: ${error.message}`,
      );
    }
  }

  /**
   * 查询需要发送开场提醒的演唱会及关联用户邮箱。
   *
   * @returns 需要提醒的演唱会与收件人集合
   */
  async getConcertsForReminder(): Promise<ConcertsReminder[]> {
    try {
      const now = new Date();
      const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const thirteenHoursLater = new Date(now.getTime() + 13 * 60 * 60 * 1000);

      // 以 12 到 13 小时后的时间窗口筛选，避免定时任务重复发送同一批提醒。
      const concerts: Concert[] = (await this.concertModel
        .find({
          date: {
            $gte: twelveHoursLater,
            $lt: thirteenHoursLater,
          },
          status: 'upcoming',
        })
        .exec()) as Concert[];

      const result: ConcertsReminder[] = [];

      for (const concert of concerts) {
        const tickets: Ticket[] = (await this.ticketModel
          .find({
            concert: concert._id,
            status: 'valid',
          })
          .populate('user')
          .exec()) as Ticket[];

        // 同一用户可能持有多张票，这里按邮箱去重后再发送提醒。
        const userEmails: string[] = [
          ...new Set(
            tickets
              .map((ticket: Ticket): string => ticket.user?.email)
              .filter((email: string): string => email),
          ),
        ];

        if (userEmails.length > 0) {
          // 只保留确实存在有效持票人的场次，减少无效发信。
          result.push({
            concert: concert.toObject() as Concert,
            userEmails,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `获取需要提醒的演唱会失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        `获取需要提醒的演唱会失败: ${error.message}`,
      );
    }
  }

  /**
   * 更新演唱会海报地址。
   *
   * @param id - 演唱会 ID
   * @param poster - 新海报地址
   * @returns 更新后的演唱会实体
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当演唱会不存在时抛出
   */
  async updatePoster(id: string, poster: string): Promise<Concert> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }
      const concert = (await this.concertModel.findById(id)) as Concert;
      if (!concert) throw new NotFoundException('演唱会不存在');

      // 海报文件本身由存储模块处理，这里只负责更新数据库中的海报地址。
      concert.poster = poster;
      await concert.save();
      return concert;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`更新演唱会海报时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('更新演唱会海报时发生错误');
    }
  }
}
