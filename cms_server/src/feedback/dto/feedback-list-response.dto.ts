import { Feedback } from '../entities/feedback.entity';

export class FeedbackListResponseDto {
  data: Feedback[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
