import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, GoogleAuthDto, TelegramAuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  loginWithGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(googleAuthDto);
  }

  @Post('telegram')
  loginWithTelegram(@Body() telegramAuthDto: TelegramAuthDto) {
    return this.authService.loginWithTelegram(telegramAuthDto);
  }
}
