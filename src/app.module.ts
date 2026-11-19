import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/index.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { CollaborationModule } from './modules/collaboration/collaboration.module.js';
import { ProjectGateWay } from './modules/projects/projects.gateway.js';
import { AppService } from './app.service.js';
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com

    PrismaModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService,ProjectGateWay],
})
export class AppModule {}
