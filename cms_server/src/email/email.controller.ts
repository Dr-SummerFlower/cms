import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendCodeDto } from './dto/send-code.dto';

@Controller('send-code')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ success: boolean }> {
    return this.emailService.sendCode(sendCodeDto);
  }
}
