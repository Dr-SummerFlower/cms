import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EcdsaService } from '../ecdsa/ecdsa.service';
import { ConcertQueryFilter, EcdsaKeyPair } from '../types';
import { ConcertListResponseDto } from './dto/concert-list-response.dto';
import { ConcertQueryDto } from './dto/concert-query.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { Concert, ConcertDocument } from './entities/concert.entity';

/**
 * 演唱会服务类
 * @description 处理演唱会相关的业务逻辑，包括创建、查询、更新和删除演唱会信息
 */
@Injectable()
export class ConcertsService {
  constructor(
    @InjectModel(Concert.name)
    private readonly concertModel: Model<ConcertDocument>,
    private readonly ecdsaService: EcdsaService,
  ) {}

  /**
   * 创建演唱会
   * @description 根据提供的数据创建新的演唱会，并为其生成ECDSA密钥对
   * @param createConcertDto 创建演唱会的数据传输对象
   * @returns 返回创建的演唱会信息
   * @throws {BadRequestException} 当演唱会数据无效时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async create(createConcertDto: CreateConcertDto): Promise<Concert> {
    try {
      // 为演唱会生成ECDSA密钥对
      const keyPair: EcdsaKeyPair = this.ecdsaService.generateKeyPair();

      // 创建包含密钥对的演唱会数据
      const concertData = {
        ...createConcertDto,
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

  /**
   * 获取演唱会列表
   * @description 分页获取演唱会列表，支持按状态和名称搜索
   * @param queryDto 查询参数对象，包含状态、搜索关键词、页码和每页数量
   * @returns 返回包含演唱会列表和分页信息的响应对象
   * @throws {BadRequestException} 当查询参数无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
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

  /**
   * 根据ID获取演唱会详情
   * @description 通过演唱会ID查询单个演唱会的详细信息
   * @param id 演唱会的唯一标识符
   * @returns 返回演唱会详细信息
   * @throws {BadRequestException} 当ID格式无效时抛出
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
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
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询演唱会详情时发生错误');
    }
  }

  /**
   * 更新演唱会信息
   * @description 根据ID更新演唱会的信息
   * @param id 演唱会的唯一标识符
   * @param updateConcertDto 更新演唱会的数据传输对象
   * @returns 返回更新后的演唱会信息
   * @throws {BadRequestException} 当ID格式无效或更新数据无效时抛出
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
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

  /**
   * 删除演唱会
   * @description 根据ID删除指定的演唱会
   * @param id 演唱会的唯一标识符
   * @returns void
   * @throws {BadRequestException} 当ID格式无效时抛出
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async remove(id: string): Promise<void> {
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
}
