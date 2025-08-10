import { Injectable, NotFoundException } from '@nestjs/common';
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
   */
  async create(createConcertDto: CreateConcertDto): Promise<Concert> {
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
    return (await this.concertModel
      .findById(savedConcert._id)
      .exec()) as Concert;
  }

  /**
   * 获取演唱会列表
   * @description 分页获取演唱会列表，支持按状态和名称搜索
   * @param queryDto 查询参数对象，包含状态、搜索关键词、页码和每页数量
   * @returns 返回包含演唱会列表和分页信息的响应对象
   */
  async findAll(queryDto: ConcertQueryDto): Promise<ConcertListResponseDto> {
    const { status, search, page = 1, limit = 10 } = queryDto;
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
  }

  /**
   * 根据ID获取演唱会详情
   * @description 通过演唱会ID查询单个演唱会的详细信息
   * @param id 演唱会的唯一标识符
   * @returns 返回演唱会详细信息
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   */
  async findOne(id: string): Promise<Concert> {
    const concert: Concert = (await this.concertModel
      .findById(id)
      .exec()) as Concert;
    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }
    return concert;
  }

  /**
   * 更新演唱会信息
   * @description 根据ID更新演唱会的信息
   * @param id 演唱会的唯一标识符
   * @param updateConcertDto 更新演唱会的数据传输对象
   * @returns 返回更新后的演唱会信息
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   */
  async update(
    id: string,
    updateConcertDto: UpdateConcertDto,
  ): Promise<Concert> {
    const concert = await this.concertModel
      .findByIdAndUpdate(id, updateConcertDto, { new: true })
      .exec();
    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }
    // 重新查询以应用select: false设置，确保私钥不被返回
    const result = await this.concertModel.findById(concert._id).exec();
    if (!result) {
      throw new NotFoundException('更新的演唱会未找到');
    }
    return result;
  }

  /**
   * 删除演唱会
   * @description 根据ID删除指定的演唱会
   * @param id 演唱会的唯一标识符
   * @returns void
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   */
  async remove(id: string): Promise<void> {
    const result: Concert = (await this.concertModel
      .findByIdAndDelete(id)
      .exec()) as Concert;
    if (!result) {
      throw new NotFoundException('演唱会不存在');
    }
  }

  /**
   * 获取演唱会的ECDSA密钥对
   * @description 根据演唱会ID获取其ECDSA密钥对，用于票据签名和验证
   * @param concertId 演唱会的唯一标识符
   * @returns 返回包含公钥和私钥的对象
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   */
  async getKeyPair(
    concertId: string,
  ): Promise<{ publicKey: string; privateKey: string }> {
    const concert: Concert = (await this.concertModel
      .findById(concertId)
      .select('publicKey privateKey')
      .exec()) as Concert;

    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }

    return {
      publicKey: concert.publicKey,
      privateKey: concert.privateKey,
    };
  }

  /**
   * 获取演唱会的公钥
   * @description 根据演唱会ID获取其公钥，用于票据验证
   * @param concertId 演唱会的唯一标识符
   * @returns 返回公钥字符串
   * @throws {NotFoundException} 当演唱会不存在时抛出异常
   */
  async getPublicKey(concertId: string): Promise<string> {
    const concert: Concert = (await this.concertModel
      .findById(concertId)
      .select('publicKey')
      .exec()) as Concert;

    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }

    return concert.publicKey;
  }
}
