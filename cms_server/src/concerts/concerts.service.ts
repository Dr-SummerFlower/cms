import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Concert, ConcertDocument } from './entities/concert.entity';
import { CreateConcertDto } from './dto/create-concert.dto';
import { UpdateConcertDto } from './dto/update-concert.dto';
import { ConcertQueryDto } from './dto/concert-query.dto';
import { ConcertListResponseDto } from './dto/concert-list-response.dto';
import { ConcertQueryFilter } from '../types';

@Injectable()
export class ConcertsService {
  constructor(
    @InjectModel(Concert.name)
    private readonly concertModel: Model<ConcertDocument>,
  ) {}

  async create(createConcertDto: CreateConcertDto): Promise<Concert> {
    const concert = new this.concertModel(createConcertDto);
    return concert.save();
  }

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

  async findOne(id: string): Promise<Concert> {
    const concert: Concert = (await this.concertModel
      .findById(id)
      .exec()) as Concert;
    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }
    return concert;
  }

  async update(
    id: string,
    updateConcertDto: UpdateConcertDto,
  ): Promise<Concert> {
    const concert: Concert = (await this.concertModel
      .findByIdAndUpdate(id, updateConcertDto, { new: true })
      .exec()) as Concert;
    if (!concert) {
      throw new NotFoundException('演唱会不存在');
    }
    return concert;
  }

  async remove(id: string): Promise<void> {
    const result: Concert = (await this.concertModel
      .findByIdAndDelete(id)
      .exec()) as Concert;
    if (!result) {
      throw new NotFoundException('演唱会不存在');
    }
  }
}
