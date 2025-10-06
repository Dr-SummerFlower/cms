import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FeedbackQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value as string, 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = parseInt(value as string, 10);
    return isNaN(parsed) ? 10 : parsed;
  })
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  errorType?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
