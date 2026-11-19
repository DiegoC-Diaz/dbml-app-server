import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Project, ProjectDetails } from './dto/projects.js';
import { DEFAULT_PROJECT_TITLE } from './dto/projects.dto.js';
import { ProjectsController } from './projects.controller.js';
import { DEFAULT_DBML_TEMPLATE, ProjectsService } from './projects.service.js';

const MOCK_USER = {
  id: 'user-1',
  username: 'tester',
  email: 'tester@example.com',
  emailVerified: true,
  githubId: null,
  createdAt: '2026-11-19T09:00:00.000Z',
  updatedAt: null,
  isActive: true,
};

function makeProjectDetails(
  overrides: Partial<ProjectDetails> = {},
): ProjectDetails {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ownerUserId: 'user-1',
    title: DEFAULT_PROJECT_TITLE,
    description: null,
    createdBy: 'user-1',
    createdAt: '2026-11-19T10:00:00.000Z',
    updatedAt: null,
    isActive: true,
    layoutMetadata: null,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    ...makeProjectDetails(overrides),
    currentDbml: DEFAULT_DBML_TEMPLATE,
    crdtState: null,
    ...overrides,
  };
}

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let projectsService: {
    create: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findDetailsById: ReturnType<typeof vi.fn>;
    updateDetails: ReturnType<typeof vi.fn>;
    findAllByOwner: ReturnType<typeof vi.fn>;
    clone: ReturnType<typeof vi.fn>;
    updateDbml: ReturnType<typeof vi.fn>;
    updateLayout: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    hardDelete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    projectsService = {
      create: vi.fn(),
      findById: vi.fn(),
      findDetailsById: vi.fn(),
      updateDetails: vi.fn(),
      findAllByOwner: vi.fn(),
      clone: vi.fn(),
      updateDbml: vi.fn(),
      updateLayout: vi.fn(),
      softDelete: vi.fn(),
      hardDelete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: projectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('allows empty or omitted body and creates a project with default title', async () => {
      const project = makeProject();
      projectsService.create.mockResolvedValue(project);

      const response = await controller.create(MOCK_USER, undefined);

      expect(projectsService.create).toHaveBeenCalledWith(MOCK_USER.id, {
        title: undefined,
        description: undefined,
        currentDbml: undefined,
        layoutMetadata: null,
      });
      expect(response.title).toBe(DEFAULT_PROJECT_TITLE);
      expect(response.currentDbml).toBe(DEFAULT_DBML_TEMPLATE);
    });

    it('forwards a custom title when provided', async () => {
      const project = makeProject({ title: 'Inventario Core' });
      projectsService.create.mockResolvedValue(project);

      const response = await controller.create(MOCK_USER, {
        title: 'Inventario Core',
      });

      expect(projectsService.create).toHaveBeenCalledWith(MOCK_USER.id, {
        title: 'Inventario Core',
        description: undefined,
        currentDbml: undefined,
        layoutMetadata: null,
      });
      expect(response.title).toBe('Inventario Core');
    });
  });

  describe('findById', () => {
    it('returns full project including currentDbml when includeDbml is omitted or true', async () => {
      const project = makeProject();
      projectsService.findById.mockResolvedValue(project);

      const resDefault = await controller.findById(project.id);
      expect(projectsService.findById).toHaveBeenCalledWith(project.id);
      expect('currentDbml' in resDefault).toBe(true);

      const resTrue = await controller.findById(project.id, 'true');
      expect(projectsService.findById).toHaveBeenCalledTimes(2);
      expect('currentDbml' in resTrue).toBe(true);
    });

    it('calls findDetailsById and omits currentDbml when includeDbml is "false"', async () => {
      const details = makeProjectDetails({
        title: 'Solo Detalles',
        description: 'Sin DBML',
      });
      projectsService.findDetailsById.mockResolvedValue(details);

      const response = await controller.findById(details.id, 'false');

      expect(projectsService.findDetailsById).toHaveBeenCalledWith(details.id);
      expect(projectsService.findById).not.toHaveBeenCalled();
      expect(response).toEqual({
        id: details.id,
        ownerUserId: details.ownerUserId,
        title: 'Solo Detalles',
        description: 'Sin DBML',
        createdBy: details.createdBy,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
        isActive: true,
        layoutMetadata: null,
      });
      expect('currentDbml' in response).toBe(false);
    });

    it('throws 400 Bad Request for invalid includeDbml query param', async () => {
      await expect(
        controller.findById('550e8400-e29b-41d4-a716-446655440000', 'yes'),
      ).rejects.toThrow(HttpException);

      try {
        await controller.findById(
          '550e8400-e29b-41d4-a716-446655440000',
          'yes',
        );
      } catch (err) {
        expect((err as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
    });
  });

  describe('updateDetails', () => {
    it('updates title and/or description via ProjectsService.updateDetails', async () => {
      const updated = makeProject({
        title: 'Actualizado',
        description: 'Descripción nueva',
      });
      projectsService.updateDetails.mockResolvedValue(updated);

      const resTitleOnly = await controller.updateDetails(updated.id, {
        title: 'Actualizado',
      });
      expect(projectsService.updateDetails).toHaveBeenCalledWith(updated.id, {
        title: 'Actualizado',
      });
      expect(resTitleOnly.title).toBe('Actualizado');

      await controller.updateDetails(updated.id, {
        description: 'Descripción nueva',
      });
      expect(projectsService.updateDetails).toHaveBeenCalledWith(updated.id, {
        description: 'Descripción nueva',
      });

      await controller.updateDetails(updated.id, {
        title: 'Actualizado',
        description: 'Descripción nueva',
      });
      expect(projectsService.updateDetails).toHaveBeenCalledWith(updated.id, {
        title: 'Actualizado',
        description: 'Descripción nueva',
      });
    });

    it('throws 400 Bad Request when payload is empty or title is blank', async () => {
      await expect(
        controller.updateDetails('550e8400-e29b-41d4-a716-446655440000', {}),
      ).rejects.toThrow(HttpException);

      await expect(
        controller.updateDetails('550e8400-e29b-41d4-a716-446655440000', {
          title: '   ',
        }),
      ).rejects.toThrow(HttpException);
    });
  });
});
