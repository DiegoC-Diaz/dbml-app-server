import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { toVarchar } from '../../common/castings.js';
import { randomUUID } from 'crypto';
import type { CreateUserDTO } from './dto/create.user.dto.js';
import type { FieldOutputTypes } from '../../prisma/contract.js';
export type UserRecord = FieldOutputTypes['public']['Users'];

@Injectable()
export class UsersRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return await this.prisma.db.orm.public.Users.where((u) => u.email.eq(toVarchar(email,255))).first();
  }


  async findById(id:string){
    return this.prisma.db.orm.public.Users.where((u) => u.id.eq(id)).first();
  }

  async create(data: CreateUserDTO): Promise<UserRecord> {
    return await this.prisma.db.orm.public.Users.create({
      id:randomUUID(),
      username:toVarchar(data.username,50),
      email:toVarchar(data.email,255),
      passwordHash:toVarchar(data.password,255)
    });
  }

}
