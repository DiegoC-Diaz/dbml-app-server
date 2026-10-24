import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { JsonValue } from '@prisma/orm-postgres/target/codec-types';
import { toVarchar } from '../../common/castings.js';
import {
  ProjectsRepository,
  type ProjectRecord,
  type UpdateProjectRecord,
} from './projects.repository.js';
import type {
  Project,
  CreateProjectInput,
  CloneProjectInput,
  UpdateProjectDetailsInput,
  UpdateProjectDbmlInput,
} from './dto/projects.js';

const DEFAULT_DBML_TEMPLATE = `// Escribe tu esquema DBML aquí
Table users {
  id uuid [primary key]
  username varchar(50) [not null, unique]
  created_at timestamp [default: \`now()\`]
}
`;

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(ProjectsRepository)
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  async create(userId: string, data: CreateProjectInput): Promise<Project> {
    const record = await this.projectsRepository.create({
      ownerUserId: userId,
      createdBy: userId,
      title: toVarchar(data.title, 150),
      description:
        data.description != null ? toVarchar(data.description, 500) : null,
      currentDbml: data.currentDbml ?? DEFAULT_DBML_TEMPLATE,
      layoutMetadata: data.layoutMetadata ?? null,
    });

    return this.toProject(record);
  }

  async clone(
    projectId: string,
    userId: string,
    overrides?: CloneProjectInput,
  ): Promise<Project> {
    const source = await this.findById(projectId);
    const clonedTitle = overrides?.title ?? `${source.title} (Copy)`.slice(0, 150);
    const clonedDescription =
      overrides?.description !== undefined
        ? overrides.description
        : source.description;

    const record = await this.projectsRepository.create({
      ownerUserId: userId,
      createdBy: userId,
      title: toVarchar(clonedTitle, 150),
      description:
        clonedDescription != null ? toVarchar(clonedDescription, 500) : null,
      currentDbml: source.currentDbml,
      layoutMetadata: source.layoutMetadata,
    });

    return this.toProject(record);
  }

  async findById(projectId: string): Promise<Project> {
    const record = await this.projectsRepository.findById(projectId);
    if (!record || !record.isActive) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    return this.toProject(record);
  }

  async findAllByOwner(ownerUserId: string): Promise<Project[]> {
    const records = await this.projectsRepository.findByOwnerId(
      ownerUserId,
      true,
    );
    return records.map((record) => this.toProject(record));
  }

  async updateDetails(
    projectId: string,
    data: UpdateProjectDetailsInput,
  ): Promise<Project> {
    await this.findById(projectId);

    const updatePayload: UpdateProjectRecord = {
      updatedAt: new Date().toISOString(),
      ...(data.title !== undefined
        ? { title: toVarchar(data.title, 150) }
        : {}),
      ...(data.description !== undefined
        ? {
            description:
              data.description !== null
                ? toVarchar(data.description, 500)
                : null,
          }
        : {}),
    };

    const updated = await this.projectsRepository.update(
      projectId,
      updatePayload,
    );
    if (!updated) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return this.toProject(updated);
  }

  async updateDbml(
    projectId: string,
    data: UpdateProjectDbmlInput,
  ): Promise<Project> {
    await this.findById(projectId);

    const updatePayload: UpdateProjectRecord = {
      currentDbml: data.currentDbml,
      updatedAt: new Date().toISOString(),
      ...(data.crdtState !== undefined ? { crdtState: data.crdtState } : {}),
      ...(data.layoutMetadata !== undefined
        ? { layoutMetadata: data.layoutMetadata }
        : {}),
    };

    const updated = await this.projectsRepository.update(
      projectId,
      updatePayload,
    );
    if (!updated) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return this.toProject(updated);
  }

  async updateLayout(
    projectId: string,
    layoutMetadata: JsonValue | null,
  ): Promise<Project> {
    await this.findById(projectId);

    const updated = await this.projectsRepository.update(projectId, {
      layoutMetadata,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return this.toProject(updated);
  }

  async softDelete(projectId: string): Promise<Project> {
    await this.findById(projectId);

    const updated = await this.projectsRepository.update(projectId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return this.toProject(updated);
  }

  async hardDelete(projectId: string): Promise<void> {
    const deleted = await this.projectsRepository.delete(projectId);
    if (!deleted) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }

  private toProject(record: ProjectRecord): Project {
    return {
      id: record.id,
      ownerUserId: record.ownerUserId,
      title: String(record.title),
      description:
        record.description === null ? null : String(record.description),
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isActive: record.isActive,
      currentDbml: record.currentDbml,
      crdtState: record.crdtState,
      layoutMetadata: record.layoutMetadata,
    };
  }
}
