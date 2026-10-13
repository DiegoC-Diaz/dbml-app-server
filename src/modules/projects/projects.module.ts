import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsController } from './projects.controller.js';

@Module({
  providers: [ProjectsService,ProjectsRepository],
  controllers: [ProjectsController]
})
export class ProjectsModule {}
