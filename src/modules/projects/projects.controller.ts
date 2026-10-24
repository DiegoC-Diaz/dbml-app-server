import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Inject,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JsonValue } from '@prisma/orm-postgres/target/codec-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { User } from '../users/dto/user.js';
import { ProjectsService } from './projects.service.js';
import {
  createProjectSchema,
  cloneProjectSchema,
  updateProjectDetailsSchema,
  updateProjectDbmlSchema,
  updateProjectLayoutSchema,
  type CreateProjectDTO,
  type CloneProjectDTO,
  type UpdateProjectDetailsDTO,
  type UpdateProjectDbmlDTO,
  type UpdateProjectLayoutDTO,
  CreateProjectSwaggerDTO,
  CloneProjectSwaggerDTO,
  UpdateProjectDetailsSwaggerDTO,
  UpdateProjectDbmlSwaggerDTO,
  UpdateProjectLayoutSwaggerDTO,
  ProjectResponseDTO,
  toProjectResponseDTO,
} from './dto/projects.dto.js';

type AuthenticatedUser = Omit<User, 'passwordHash'>;

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo proyecto DBML',
    description:
      'Inicializa un nuevo proyecto asignando al usuario autenticado como propietario (Owner).',
  })
  @ApiBody({ type: CreateProjectSwaggerDTO })
  @ApiCreatedResponse({
    description: 'Proyecto creado exitosamente.',
    type: ProjectResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body({ schema: createProjectSchema }) dto: CreateProjectDTO,
  ): Promise<ProjectResponseDTO> {
    const parsed = createProjectSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(parsed.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const project = await this.projectsService.create(user.id, {
      title: parsed.data.title,
      description: parsed.data.description,
      currentDbml: parsed.data.currentDbml,
      layoutMetadata: (parsed.data.layoutMetadata as JsonValue) ?? null,
    });

    return toProjectResponseDTO(project);
  }

  @Post(':id/clone')
  @ApiOperation({
    summary: 'Clonar / copiar un proyecto existente',
    description:
      'Crea una copia independiente del código DBML y layout de un proyecto bajo la propiedad del usuario autenticado.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto origen a clonar',
    format: 'uuid',
  })
  @ApiBody({ type: CloneProjectSwaggerDTO, required: false })
  @ApiCreatedResponse({
    description: 'Proyecto clonado exitosamente.',
    type: ProjectResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Proyecto origen no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async clone(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body({ schema: cloneProjectSchema }) dto?: CloneProjectDTO,
  ): Promise<ProjectResponseDTO> {
    const parsed = cloneProjectSchema.safeParse(dto ?? {});
    if (!parsed.success) {
      throw new HttpException(parsed.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const project = await this.projectsService.clone(id, user.id, parsed.data);
    return toProjectResponseDTO(project);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar proyectos del usuario autenticado',
    description:
      'Obtiene todos los proyectos activos en los que el usuario autenticado es propietario.',
  })
  @ApiOkResponse({
    description: 'Lista de proyectos obtenida exitosamente.',
    type: [ProjectResponseDTO],
  })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async findAllByOwner(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDTO[]> {
    const projects = await this.projectsService.findAllByOwner(user.id);
    return projects.map(toProjectResponseDTO);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un proyecto por ID',
    description:
      'Retorna los detalles, código DBML actual y layout de un proyecto activo.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Proyecto encontrado.',
    type: ProjectResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado o inactivo.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponseDTO> {
    const project = await this.projectsService.findById(id);
    return toProjectResponseDTO(project);
  }

  @Patch(':id/details')
  @ApiOperation({
    summary: 'Actualizar datos generales del proyecto (título y descripción)',
    description:
      'Permite modificar los metadatos administrativos del proyecto sin alterar el código DBML.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateProjectDetailsSwaggerDTO })
  @ApiOkResponse({
    description: 'Datos del proyecto actualizados.',
    type: ProjectResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async updateDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: updateProjectDetailsSchema }) dto: UpdateProjectDetailsDTO,
  ): Promise<ProjectResponseDTO> {
    const parsed = updateProjectDetailsSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(parsed.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const project = await this.projectsService.updateDetails(id, parsed.data);
    return toProjectResponseDTO(project);
  }

  @Patch(':id/dbml')
  @ApiOperation({
    summary: 'Actualizar el código DBML del proyecto',
    description:
      'Actualiza el contenido DBML (`currentDbml`) y opcionalmente el estado del layout visual.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateProjectDbmlSwaggerDTO })
  @ApiOkResponse({
    description: 'Código DBML actualizado exitosamente.',
    type: ProjectResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async updateDbml(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: updateProjectDbmlSchema }) dto: UpdateProjectDbmlDTO,
  ): Promise<ProjectResponseDTO> {
    const parsed = updateProjectDbmlSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(parsed.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const project = await this.projectsService.updateDbml(id, {
      currentDbml: parsed.data.currentDbml,
      ...(parsed.data.layoutMetadata !== undefined
        ? { layoutMetadata: parsed.data.layoutMetadata as JsonValue }
        : {}),
    });

    return toProjectResponseDTO(project);
  }

  @Patch(':id/layout')
  @ApiOperation({
    summary: 'Actualizar únicamente el layout visual del diagrama ER',
    description:
      'Guarda posiciones de tablas, zoom o metadatos del canvas sin reenviar todo el código DBML.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiBody({ type: UpdateProjectLayoutSwaggerDTO })
  @ApiOkResponse({
    description: 'Layout actualizado exitosamente.',
    type: ProjectResponseDTO,
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos.' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async updateLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body({ schema: updateProjectLayoutSchema }) dto: UpdateProjectLayoutDTO,
  ): Promise<ProjectResponseDTO> {
    const parsed = updateProjectLayoutSchema.safeParse(dto);
    if (!parsed.success) {
      throw new HttpException(parsed.error.flatten(), HttpStatus.BAD_REQUEST);
    }

    const project = await this.projectsService.updateLayout(
      id,
      parsed.data.layoutMetadata as JsonValue,
    );

    return toProjectResponseDTO(project);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archivar / eliminar lógicamente un proyecto (Soft Delete)',
    description:
      'Marca el proyecto como inactivo (`isActive = false`) conservando el registro en base de datos.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Proyecto archivado (soft-delete) exitosamente.',
    type: ProjectResponseDTO,
  })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponseDTO> {
    const project = await this.projectsService.softDelete(id);
    return toProjectResponseDTO(project);
  }

  @Delete(':id/purge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar definitivamente un proyecto (Hard Delete / Purga)',
    description:
      'Borra de forma permanente el registro del proyecto en la base de datos.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del proyecto',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Proyecto eliminado permanentemente.',
  })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'No autenticado.' })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectsService.hardDelete(id);
  }
}
