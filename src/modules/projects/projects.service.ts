import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { JsonValue } from '@prisma/orm-postgres/target/codec-types';
import { appConfig } from '../../common/app-config.js';
import { toVarchar } from '../../common/castings.js';
import {
  ProjectsRepository,
  type ProjectRecord,
  type ProjectDetailsRecord,
  type UpdateProjectRecord,
} from './projects.repository.js';
import type {
  Project,
  ProjectDetails,
  CreateProjectInput,
  CloneProjectInput,
  UpdateProjectDetailsInput,
  UpdateProjectDbmlInput,
} from './dto/projects.js';

export const DEFAULT_DBML_TEMPLATE = `// Escribe tu esquema DBML aquí
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
    const resolvedTitle =
      data.title?.trim() || appConfig.projects.defaultTitle;
    const trimmedDescription = data.description?.trim();

    const record = await this.projectsRepository.create({
      ownerUserId: userId,
      createdBy: userId,
      title: toVarchar(resolvedTitle, 150),
      description: trimmedDescription ? toVarchar(trimmedDescription, 500) : null,
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

  async findDetailsById(projectId: string): Promise<ProjectDetails> {
    const record = await this.projectsRepository.findDetailsById(projectId);
    if (!record || !record.isActive) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
    return this.toProjectDetails(record);
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
    await this.findDetailsById(projectId);

    const normalizedDescription =
      data.description === undefined
        ? undefined
        : data.description === null || data.description.trim().length === 0
          ? null
          : toVarchar(data.description.trim(), 500);

    const updatePayload: UpdateProjectRecord = {
      updatedAt: new Date().toISOString(),
      ...(data.title !== undefined
        ? { title: toVarchar(data.title.trim(), 150) }
        : {}),
      ...(normalizedDescription !== undefined
        ? { description: normalizedDescription }
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

  private toProjectDetails(record: ProjectDetailsRecord): ProjectDetails {
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
      layoutMetadata: record.layoutMetadata,
    };
  }

  private toProject(record: ProjectRecord): Project {
    return {
      ...this.toProjectDetails(record),
      currentDbml: record.currentDbml,
      crdtState: record.crdtState,
    };
  }
}
