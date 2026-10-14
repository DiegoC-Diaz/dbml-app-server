import { Inject, Injectable, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service.js";
@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; username: string }) {
    const existing = await this.usersService.findByEmail(data.email);

    if (existing) {
      throw new BadRequestException("El correo electrónico ya está registrado");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      username: data.username,
    });



    const token = this.jwtService.sign({ sub: newUser.id, email: newUser.email });
    return { user: newUser, token };
  }

  async refresh(refreshToken: string) {
    const payload = await this.validateRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("Usuario no válido o inexistente");
    }

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async validateRefreshToken(token: string) {
  try {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET||"key_development",
      algorithms: ['HS256'],
    });

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
}


  async login(data: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }
    const validPasswordHash=user.passwordHash?.toString()||null;
    if(!validPasswordHash){
         throw new UnauthorizedException("Credenciales inválidas");
    }

    const isMatch = await bcrypt.compare(data.password,validPasswordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const access_token = this.jwtService.sign({ sub: user.id, email: user.email });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, tokenType: "refresh" },
      {
        expiresIn: "7d",
        secret: process.env.JWT_SECRET || "key_development",
      },
    );
  
  
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token: access_token, refreshToken };
  }
}