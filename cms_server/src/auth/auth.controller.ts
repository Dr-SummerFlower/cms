import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ValidationService } from './validation.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly validationService: ValidationService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ access_token: string }> {
    await this.validationService.validateCode(
      registerDto.email,
      registerDto.code,
      'register',
    );
    const result: { access_token: string } = await this.authService.register({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
    });
    await this.validationService.clearCode(registerDto.email, 'register');
    return result;
  }
}
