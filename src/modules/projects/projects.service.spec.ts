import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toVarchar } from '../../common/castings.js';
import { DEFAULT_PROJECT_TITLE } from './dto/projects.dto.js';
import {
  ProjectsRepository,
  type ProjectDetailsRecord,
  type ProjectRecord,
} from './projects.repository.js';
import {
  DEFAULT_DBML_TEMPLATE,
  ProjectsService,
} from './projects.service.js';

function makeProjectRecord(
  overrides: Partial<ProjectRecord> = {},
): ProjectRecord {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ownerUserId: 'user-1',
    title: toVarchar('Mi Proyecto', 150),
    description: null,
    createdBy: 'user-1',
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: null,
    isActive: true,
    currentDbml: DEFAULT_DBML_TEMPLATE,
    crdtState: null,
    layoutMetadata: null,
    ...overrides,
  };
}

function makeProjectDetailsRecord(
  overrides: Partial<ProjectDetailsRecord> = {},
): ProjectDetailsRecord {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ownerUserId: 'user-1',
    title: toVarchar('Mi Proyecto', 150),
    description: null,
    createdBy: 'user-1',
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: null,
    isActive: true,
    layoutMetadata: null,
    ...overrides,
  };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findDetailsById: ReturnType<typeof vi.fn>;
    findByOwnerId: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findDetailsById: vi.fn(),
      findByOwnerId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a project with a trimmed custom title and default DBML template', async () => {
      const created = makeProjectRecord({
        title: toVarchar('Esquema Ventas', 150),
      });
      repository.create.mockResolvedValue(created);

      const result = await service.create('user-1', {
        title: '  Esquema Ventas  ',
      });

      expect(repository.create).toHaveBeenCalledWith({
        ownerUserId: 'user-1',
        createdBy: 'user-1',
        title: 'Esquema Ventas',
        description: null,
        currentDbml: DEFAULT_DBML_TEMPLATE,
        layoutMetadata: null,
      });
      expect(result.title).toBe('Esquema Ventas');
      expect(result.currentDbml).toBe(DEFAULT_DBML_TEMPLATE);
    });

    it('uses DEFAULT_PROJECT_TITLE and DEFAULT_DBML_TEMPLATE when title is omitted or blank', async () => {
      const created = makeProjectRecord({
        title: toVarchar(DEFAULT_PROJECT_TITLE, 150),
      });
      repository.create.mockResolvedValue(created);

      const resultOmitted = await service.create('user-1', {});
      expect(repository.create).toHaveBeenLastCalledWith({
        ownerUserId: 'user-1',
        createdBy: 'user-1',
        title: DEFAULT_PROJECT_TITLE,
        description: null,
        currentDbml: DEFAULT_DBML_TEMPLATE,
        layoutMetadata: null,
      });
      expect(resultOmitted.title).toBe(DEFAULT_PROJECT_TITLE);

      await service.create('user-1', { title: '   ', description: '   ' });
      expect(repository.create).toHaveBeenLastCalledWith({
        ownerUserId: 'user-1',
        createdBy: 'user-1',
        title: DEFAULT_PROJECT_TITLE,
        description: null,
        currentDbml: DEFAULT_DBML_TEMPLATE,
        layoutMetadata: null,
      });
    });
  });

  describe('findDetailsById', () => {
    it('returns project metadata without currentDbml or crdtState', async () => {
      const record = makeProjectDetailsRecord({
        description: toVarchar('Base de datos principal', 500),
      });
      repository.findDetailsById.mockResolvedValue(record);

      const result = await service.findDetailsById(record.id);

      expect(repository.findDetailsById).toHaveBeenCalledWith(record.id);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: record.id,
        ownerUserId: 'user-1',
        title: 'Mi Proyecto',
        description: 'Base de datos principal',
        createdBy: 'user-1',
        createdAt: '2026-11-19T10:00:00.000Z',
        updatedAt: null,
        isActive: true,
        layoutMetadata: null,
      });
      expect('currentDbml' in result).toBe(false);
      expect('crdtState' in result).toBe(false);
    });

    it('throws NotFoundException when project is missing or inactive', async () => {
      repository.findDetailsById.mockResolvedValueOnce(null);
      await expect(service.findDetailsById('missing-id')).rejects.toThrow(
        NotFoundException,
      );

      repository.findDetailsById.mockResolvedValueOnce(
        makeProjectDetailsRecord({ isActive: false }),
      );
      await expect(
        service.findDetailsById('550e8400-e29b-41d4-a716-446655440000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDetails', () => {
    it('verifies existence via findDetailsById and updates title and description', async () => {
      const existing = makeProjectDetailsRecord();
      const updated = makeProjectRecord({
        title: toVarchar('Nuevo Nombre', 150),
        description: toVarchar('Nueva descripción', 500),
        updatedAt: '2026-11-19T11:00:00.000Z',
      });
      repository.findDetailsById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(updated);

      const result = await service.updateDetails(existing.id, {
        title: '  Nuevo Nombre  ',
        description: '  Nueva descripción  ',
      });

      expect(repository.findDetailsById).toHaveBeenCalledWith(existing.id);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(existing.id, {
        updatedAt: expect.any(String),
        title: 'Nuevo Nombre',
        description: 'Nueva descripción',
      });
      expect(result.title).toBe('Nuevo Nombre');
      expect(result.description).toBe('Nueva descripción');
    });

    it('clears description to null when an empty string is provided', async () => {
      const existing = makeProjectDetailsRecord({
        description: toVarchar('Texto previo', 500),
      });
      const updated = makeProjectRecord({ description: null });
      repository.findDetailsById.mockResolvedValue(existing);
      repository.update.mockResolvedValue(updated);

      const result = await service.updateDetails(existing.id, {
        description: '   ',
      });

      expect(repository.update).toHaveBeenCalledWith(existing.id, {
        updatedAt: expect.any(String),
        description: null,
      });
      expect(result.description).toBeNull();
    });

    it('throws NotFoundException when project does not exist', async () => {
      repository.findDetailsById.mockResolvedValue(null);

      await expect(
        service.updateDetails('missing-id', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
