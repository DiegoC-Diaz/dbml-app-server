import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateInput } from '@prisma/orm-postgres/orm-client';
import { PrismaService } from '../../prisma/index.js';
import type { Contract, FieldOutputTypes } from '../../prisma/contract.js';

export type ProjectRecord = FieldOutputTypes['public']['Projects'];
export type CreateProjectRecord = Omit<
  CreateInput<Contract, 'Projects', 'public'>,
  'id'
> & { id?: string };
export type UpdateProjectRecord = Partial<
  Omit<ProjectRecord, 'id' | 'createdAt' | 'createdBy'>
>;

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateProjectRecord): Promise<ProjectRecord> {
    return await this.prisma.db.orm.public.Projects.create({
      ...data,
      id: data.id ?? randomUUID(),
    });
  }

  async findAll(): Promise<ProjectRecord[]> {
    return await this.prisma.db.orm.public.Projects.all();
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    return await this.prisma.db.orm.public.Projects.where({ id }).first();
  }

  async findByOwnerId(
    ownerUserId: string,
    onlyActive = true,
  ): Promise<ProjectRecord[]> {
    return await this.prisma.db.orm.public.Projects.where({
      ownerUserId,
      ...(onlyActive ? { isActive: true } : {}),
    }).all();
  }

  async update(
    id: string,
    data: UpdateProjectRecord,
  ): Promise<ProjectRecord | null> {
    return await this.prisma.db.orm.public.Projects.where({ id }).update(data);
  }

  async delete(id: string): Promise<ProjectRecord | null> {
    return await this.prisma.db.orm.public.Projects.where({ id }).delete();
  }
}
