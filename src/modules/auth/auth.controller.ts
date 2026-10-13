import { Controller, Post, Body, Get, UseGuards, Inject, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { type RegisterDTO, type LoginDTO, registerSchema, loginSchema } from './dto/auth.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ApiTags } from '@nestjs/swagger';
import { RegisterResponseDTO } from './dto/register.response.dto.js';
@ApiTags("Auth")
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body({schema:registerSchema}) dto: RegisterDTO):Promise<RegisterResponseDTO>{
    if(!registerSchema.validate(dto)){
      throw new HttpException('Invalid Schema',HttpStatus.BAD_REQUEST)
    }
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body({schema:loginSchema}) dto: LoginDTO) {
    if(!loginSchema.validate(dto)){
      throw new HttpException('Invalid Schema',HttpStatus.BAD_REQUEST)
    }
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
