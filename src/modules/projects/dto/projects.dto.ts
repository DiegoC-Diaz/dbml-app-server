import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { JsonValue } from '@prisma/orm-postgres/target/codec-types';
import { z } from 'zod';
import type { Project } from './projects.js';

export const createProjectSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(500).nullable().optional(),
  currentDbml: z.string().optional(),
  layoutMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const cloneProjectSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const updateProjectDetailsSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const updateProjectDbmlSchema = z.object({
  currentDbml: z.string(),
  layoutMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateProjectLayoutSchema = z.object({
  layoutMetadata: z.record(z.string(), z.unknown()).nullable(),
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type CloneProjectDTO = z.infer<typeof cloneProjectSchema>;
export type UpdateProjectDetailsDTO = z.infer<
  typeof updateProjectDetailsSchema
>;
export type UpdateProjectDbmlDTO = z.infer<typeof updateProjectDbmlSchema>;
export type UpdateProjectLayoutDTO = z.infer<typeof updateProjectLayoutSchema>;

export class CreateProjectSwaggerDTO {
  @ApiProperty({
    description: 'Título del proyecto (máximo 150 caracteres)',
    example: 'E-Commerce Database Schema',
    maxLength: 150,
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional del proyecto (máximo 500 caracteres)',
    example: 'Modelo relacional para órdenes, usuarios e inventario',
    maxLength: 500,
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Código DBML inicial (si se omite, se usa plantilla base)',
    example: 'Table users {\n  id uuid [pk]\n  email varchar(255)\n}',
  })
  currentDbml?: string;

  @ApiPropertyOptional({
    description: 'Metadatos de posición y layout del diagrama en JSON',
    example: { nodes: { users: { x: 100, y: 120 } }, zoom: 1 },
    nullable: true,
  })
  layoutMetadata?: Record<string, unknown> | null;
}

export class CloneProjectSwaggerDTO {
  @ApiPropertyOptional({
    description: 'Nuevo título para la copia del proyecto',
    example: 'E-Commerce Database Schema (Copia)',
    maxLength: 150,
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción para la copia del proyecto',
    example: 'Copia experimental para pruebas de refactorización',
    maxLength: 500,
    nullable: true,
  })
  description?: string | null;
}

export class UpdateProjectDetailsSwaggerDTO {
  @ApiPropertyOptional({
    description: 'Nuevo título del proyecto',
    example: 'E-Commerce Core v2',
    maxLength: 150,
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción del proyecto',
    example: 'Esquema actualizado para v2',
    maxLength: 500,
    nullable: true,
  })
  description?: string | null;
}

export class UpdateProjectDbmlSwaggerDTO {
  @ApiProperty({
    description: 'Código DBML actualizado del proyecto',
    example:
      'Table users {\n  id uuid [pk]\n  username varchar(50) [not null]\n}',
  })
  currentDbml!: string;

  @ApiPropertyOptional({
    description: 'Metadatos opcionales del layout del canvas',
    example: { nodes: { users: { x: 150, y: 200 } }, zoom: 1.2 },
    nullable: true,
  })
  layoutMetadata?: Record<string, unknown> | null;
}

export class UpdateProjectLayoutSwaggerDTO {
  @ApiProperty({
    description: 'Metadatos del layout visual del diagrama (coordenadas, zoom)',
    example: { nodes: { users: { x: 240, y: 180 } }, zoom: 1 },
    nullable: true,
  })
  layoutMetadata!: Record<string, unknown> | null;
}

export class ProjectResponseDTO {
  @ApiProperty({
    description: 'ID único del proyecto (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID del usuario propietario del proyecto (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  ownerUserId!: string;

  @ApiProperty({
    description: 'Título del proyecto',
    example: 'E-Commerce Database Schema',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción del proyecto',
    example: 'Modelo relacional para órdenes, usuarios e inventario',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'ID del usuario creador original (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Fecha de creación (ISO 8601)',
    example: '2026-10-21T09:00:00.000Z',
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: 'Fecha de última actualización (ISO 8601)',
    example: '2026-10-21T10:00:00.000Z',
    nullable: true,
  })
  updatedAt!: string | null;

  @ApiProperty({
    description: 'Indica si el proyecto está activo',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Contenido actual en sintaxis DBML',
    example: 'Table users {\n  id uuid [pk]\n}',
  })
  currentDbml!: string;

  @ApiPropertyOptional({
    description: 'Metadatos de layout del canvas en formato JSON',
    example: { nodes: { users: { x: 100, y: 120 } }, zoom: 1 },
    nullable: true,
  })
  layoutMetadata!: JsonValue | null;
}

export function toProjectResponseDTO(project: Project): ProjectResponseDTO {
  return {
    id: project.id,
    ownerUserId: project.ownerUserId,
    title: project.title,
    description: project.description,
    createdBy: project.createdBy,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    isActive: project.isActive,
    currentDbml: project.currentDbml,
    layoutMetadata: project.layoutMetadata,
  };
}
