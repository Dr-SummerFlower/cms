import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  timestamp: string;

  @IsString()
  userAgent: string;

  @IsString()
  url: string;

  @IsString()
  errorType: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsNumber()
  routeStatus?: number;

  @IsOptional()
  @IsString()
  routeStatusText?: string;

  @IsOptional()
  @IsString()
  routeData?: string;
}
