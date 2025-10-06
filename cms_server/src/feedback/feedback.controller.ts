import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackListResponseDto } from './dto/feedback-list-response.dto';
import { FeedbackQueryDto } from './dto/feedback-query.dto';
import { Feedback } from './entities/feedback.entity';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<{ ok: boolean; data: Feedback }> {
    const feedback: Feedback =
      await this.feedbackService.create(createFeedbackDto);
    return {
      ok: true,
      data: feedback,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(
    @Query() query: FeedbackQueryDto,
  ): Promise<FeedbackListResponseDto> {
    return this.feedbackService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findOne(@Param('id') id: string): Promise<Feedback> {
    const feedback: Feedback | null = await this.feedbackService.findById(id);
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return feedback;
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Feedback> {
    const feedback: Feedback | null = await this.feedbackService.updateStatus(
      id,
      status,
    );
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return feedback;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string): Promise<{ ok: boolean }> {
    await this.feedbackService.delete(id);
    return { ok: true };
  }
}
