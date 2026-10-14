import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  type RegisterDTO,
  type LoginDTO,
  registerSchema,
  loginSchema,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiTags } from '@nestjs/swagger';
import { RegisterResponseDTO } from './dto/register.response.dto.js';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body({ schema: registerSchema }) dto: RegisterDTO,
  ): Promise<RegisterResponseDTO> {
    if (!registerSchema.validate(dto)) {
      throw new HttpException('Invalid Schema', HttpStatus.BAD_REQUEST);
    }
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body({ schema: loginSchema }) dto: LoginDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!loginSchema.validate(dto)) {
      throw new HttpException('Invalid Schema', HttpStatus.BAD_REQUEST);
    }
    const { refreshToken, ...result } = await this.authService.login(dto);
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false, //NOTE: must be set True  to pass the cookie over HTTPS only
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return result;
  }

  @Post('refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies?.refresh_token;
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token requerido',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
