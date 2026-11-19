import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Y from 'yjs';
import type { Project } from '../projects/dto/projects.js';
import { ProjectsService } from '../projects/projects.service.js';
import { CollaborationService } from './collaboration.service.js';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-123',
    ownerUserId: 'user-1',
    title: 'Test Project',
    description: null,
    createdBy: 'user-1',
    createdAt: '2026-11-19T00:00:00.000Z',
    updatedAt: null,
    isActive: true,
    currentDbml: 'Table users {\n  id uuid [primary key]\n}',
    crdtState: null,
    layoutMetadata: null,
    ...overrides,
  };
}

describe('CollaborationService', () => {
  let service: CollaborationService;
  let projectsService: {
    findById: ReturnType<typeof vi.fn>;
    updateDbml: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    projectsService = {
      findById: vi.fn(),
      updateDbml: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        {
          provide: ProjectsService,
          useValue: projectsService,
        },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchDocument', () => {
    it('returns crdtState when the project already has persisted CRDT state', async () => {
      const sourceDoc = new Y.Doc();
      sourceDoc.getText('dbml').insert(0, 'Table orders { id int }');
      const crdtState = Y.encodeStateAsUpdate(sourceDoc);

      projectsService.findById.mockResolvedValue(
        makeProject({ crdtState, currentDbml: 'Table old {}' }),
      );

      const targetDoc = new Y.Doc();
      const result = await service.fetchDocument('project-123', targetDoc);

      expect(projectsService.findById).toHaveBeenCalledWith('project-123');
      expect(result).toBe(crdtState);
      expect(targetDoc.getText('dbml').toJSON()).toBe('');
    });

    it('seeds Y.Text("dbml") from currentDbml when crdtState is null', async () => {
      projectsService.findById.mockResolvedValue(
        makeProject({
          crdtState: null,
          currentDbml: 'Table posts { id uuid [pk] }',
        }),
      );

      const targetDoc = new Y.Doc();
      const result = await service.fetchDocument('project-123', targetDoc);

      expect(result).toBeNull();
      expect(targetDoc.getText('dbml').toJSON()).toBe(
        'Table posts { id uuid [pk] }',
      );
    });

    it('propagates NotFoundException when project does not exist', async () => {
      projectsService.findById.mockRejectedValue(
        new NotFoundException('Project with id missing not found'),
      );

      const targetDoc = new Y.Doc();
      await expect(
        service.fetchDocument('missing', targetDoc),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('storeDocument', () => {
    it('persists both plain DBML text and binary CRDT state via ProjectsService.updateDbml', async () => {
      const doc = new Y.Doc();
      doc.getText('dbml').insert(0, 'Table items { id serial [pk] }');
      const state = Buffer.from(Y.encodeStateAsUpdate(doc));

      projectsService.updateDbml.mockResolvedValue(
        makeProject({
          currentDbml: 'Table items { id serial [pk] }',
          crdtState: new Uint8Array(state),
        }),
      );

      await service.storeDocument('project-123', doc, state);

      expect(projectsService.updateDbml).toHaveBeenCalledTimes(1);
      expect(projectsService.updateDbml).toHaveBeenCalledWith('project-123', {
        currentDbml: 'Table items { id serial [pk] }',
        crdtState: new Uint8Array(state),
      });
    });
  });
});
