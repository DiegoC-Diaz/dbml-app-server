import { Injectable,Inject } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository.js';
@Injectable()
export class ProjectsService {
    constructor(@Inject(ProjectsRepository) private readonly projectsRepository: ProjectsRepository){}


    
}
