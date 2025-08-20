import {
  BadRequestException,
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

  async create(
    createConcertDto: CreateConcertDto,
    poster: string,
  ): Promise<Concert> {
    try {
      const keyPair: EcdsaKeyPair = this.ecdsaService.generateKeyPair();

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
      if (error.name === 'ValidationError') {
        throw new BadRequestException('演唱会数据验证失败');
      }
      if (error.code === 11000) {
        throw new BadRequestException('演唱会名称已存在');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('创建演唱会时发生错误');
    }
  }

  async findAll(queryDto: ConcertQueryDto): Promise<ConcertListResponseDto> {
    try {
      const { status, search, page = 1, limit = 10 } = queryDto;

      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException(
          '页码和每页数量必须为正数，且每页数量不能超过100',
        );
      }

      const skip: number = (page - 1) * limit;

      const filter: ConcertQueryFilter = {};
      if (status) {
        filter.status = status;
      }
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }

      const [concerts, total]: [Concert[], number] = await Promise.all([
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
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('获取演唱会列表时发生错误');
    }
  }

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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询演唱会详情时发生错误');
    }
  }

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
      const result: Concert = (await this.concertModel
        .findById(concert._id)
        .exec()) as Concert;
      if (!result) {
        throw new InternalServerErrorException('更新的演唱会未找到');
      }
      return result;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('演唱会数据验证失败');
      }
      if (error.code === 11000) {
        throw new BadRequestException('演唱会名称已存在');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新演唱会时发生错误');
    }
  }

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
      return null;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除演唱会时发生错误');
    }
  }

  async updateConcertStatuses(): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
      this.logger.error('更新演唱会状态失败:', error.message);
      throw new InternalServerErrorException(
        `更新演唱会状态失败: ${error.message}`,
      );
    }
  }

  async getConcertsForReminder(): Promise<ConcertsReminder[]> {
    try {
      const now = new Date();
      const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const thirteenHoursLater = new Date(now.getTime() + 13 * 60 * 60 * 1000);

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

        const userEmails: string[] = [
          ...new Set(
            tickets
              .map((ticket: Ticket): string => ticket.user?.email)
              .filter((email: string): string => email),
          ),
        ];

        if (userEmails.length > 0) {
          result.push({
            concert: concert.toObject() as Concert,
            userEmails,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error('获取需要提醒的演唱会失败:', error.message);
      throw new InternalServerErrorException(
        `获取需要提醒的演唱会失败: ${error.message}`,
      );
    }
  }

  async updatePoster(id: string, poster: string): Promise<Concert> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }
      const concert = (await this.concertModel.findById(id)) as Concert;
      if (!concert) throw new NotFoundException('演唱会不存在');

      concert.poster = poster;
      await concert.save();
      return concert;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新演唱会海报时发生错误');
    }
  }
}
