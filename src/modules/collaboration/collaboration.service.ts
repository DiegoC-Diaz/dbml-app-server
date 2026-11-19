import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { Database } from '@hocuspocus/extension-database';
import { Server } from '@hocuspocus/server';
import type * as Y from 'yjs';
import { ProjectsService } from '../projects/projects.service.js';
import collaborationConfig from './config.json' with { type: 'json' };

@Injectable()
export class CollaborationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CollaborationService.name);
  private server: Server | null = null;

  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const port = this.resolvePort();

    this.server = new Server({
      port,
      stopOnSignals: collaborationConfig.stopOnSignals,
      debounce: collaborationConfig.debounceMs,
      maxDebounce: collaborationConfig.maxDebounceMs,
      quiet: collaborationConfig.quiet,
      // TODO(v2): Add onAuthenticate hook to validate JWT and project membership (projects_users).
      extensions: [
        new Database({
          fetch: async ({ documentName, document }) =>
            this.fetchDocument(documentName, document),
          store: async ({ documentName, document, state }) =>
            this.storeDocument(documentName, document, state),
        }),
      ],
    });

    await this.server.listen();
    this.logger.log(`Hocuspocus WebSocket server listening on port ${port}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.server) {
      return;
    }

    this.server.hocuspocus.flushPendingStores();
    await this.server.destroy();
    this.server = null;
    this.logger.log('Hocuspocus WebSocket server stopped');
  }

  /**
   * Loads the Yjs document state for a project from PostgreSQL.
   * Returns persisted CRDT binary state if present; otherwise seeds Y.Text('dbml') from currentDbml.
   */
  async fetchDocument(
    documentName: string,
    document: Y.Doc,
  ): Promise<Uint8Array | null> {
    const project = await this.projectsService.findById(documentName);

    if (project.crdtState && project.crdtState.length > 0) {
      return project.crdtState;
    }

    const yText = document.getText(collaborationConfig.dbmlTextKey);
    if (yText.length === 0 && project.currentDbml) {
      document.transact(() => {
        yText.insert(0, project.currentDbml);
      });
    }

    return null;
  }

  /**
   * Persists both the plain DBML text and the binary Yjs CRDT state to PostgreSQL.
   */
  async storeDocument(
    documentName: string,
    document: Y.Doc,
    state: Buffer,
  ): Promise<void> {
    const currentDbml = document
      .getText(collaborationConfig.dbmlTextKey)
      .toJSON();

    await this.projectsService.updateDbml(documentName, {
      currentDbml,
      crdtState: new Uint8Array(state),
    });
  }

  private resolvePort(): number {
    const rawPort = process.env.HOCUSPOCUS_PORT;
    if (!rawPort) {
      return collaborationConfig.defaultPort;
    }

    const parsed = Number(rawPort);
    return Number.isInteger(parsed) && parsed > 0
      ? parsed
      : collaborationConfig.defaultPort;
  }
}
