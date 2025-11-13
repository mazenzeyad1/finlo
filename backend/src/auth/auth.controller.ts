import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ActiveUser } from './decorators/active-user.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ signup: { limit: 5, ttl: 300 } })
  async signUp(
    @Body() dto: SignUpDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string | undefined
  ) {
    return this.authService.signUp(dto, { userAgent, ip });
  }

  @Post('signin')
  @Throttle({ signin: { limit: 10, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string | undefined
  ) {
    return this.authService.signIn(dto, { userAgent, ip });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string | undefined
  ) {
    return this.authService.refresh(dto, { userAgent, ip });
  }

  @Post('verify')
  @Throttle({ verify: { limit: 1, ttl: 60 } })
  async verify(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.uid, dto.token);
  }

  @Post('verify/resend')
  @UseGuards(JwtAuthGuard)
  @Throttle({ 'verify-resend': { limit: 1, ttl: 60 } })
  async resend(@ActiveUser() user: { userId: string }) {
    return this.authService.resendVerification(user.userId);
  }

  @Post('forgot')
  @Throttle({ forgot: { limit: 5, ttl: 900 } })
  @HttpCode(HttpStatus.OK)
  async forgot(
    @Body() dto: ForgotPasswordDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string | undefined
  ) {
    return this.authService.forgotPassword(dto, { userAgent, ip });
  }

  @Post('reset')
  @Throttle({ reset: { limit: 5, ttl: 300 } })
  @HttpCode(HttpStatus.OK)
  async reset(
    @Body() dto: ResetPasswordDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string | undefined
  ) {
    return this.authService.resetPassword(dto, { userAgent, ip });
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async sessions(@ActiveUser() user: { userId: string; sessionId: string }) {
    return this.authService.listSessions(user.userId, user.sessionId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@ActiveUser() user: { userId: string }, @Param('id') id: string) {
    return this.authService.revokeSessionById(user.userId, id);
  }
}
