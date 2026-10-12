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

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, token };
  }
}