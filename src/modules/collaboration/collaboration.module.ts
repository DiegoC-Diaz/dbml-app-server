import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { CollaborationService } from './collaboration.service.js';

@Module({
  imports: [ProjectsModule],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
