import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackListResponseDto } from './dto/feedback-list-response.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { Feedback, FeedbackDocument } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = new this.feedbackModel(createFeedbackDto);
    return feedback.save();
  }

  async findAll(query: FeedbackQueryDto): Promise<FeedbackListResponseDto> {
    const { page = 1, limit = 10, status, errorType, search } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const filter: FilterQuery<FeedbackDocument> = {};

    if (status) {
      filter.status = status;
    }

    if (errorType) {
      filter.errorType = errorType;
    }

    if (search) {
      filter.$or = [
        { message: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
        { userAgent: { $regex: search, $options: 'i' } },
      ];
    }

    // 执行查询
    const [data, total] = await Promise.all([
      this.feedbackModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.feedbackModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Feedback | null> {
    return this.feedbackModel.findById(id).exec();
  }

  async updateStatus(id: string, status: string): Promise<Feedback | null> {
    return this.feedbackModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.feedbackModel.findByIdAndDelete(id).exec();
  }
}
