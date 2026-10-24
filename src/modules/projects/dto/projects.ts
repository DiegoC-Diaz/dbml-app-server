import type { JsonValue } from '@prisma/orm-postgres/target/codec-types';

export interface Project {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  currentDbml: string;
  crdtState: Uint8Array | null;
  layoutMetadata: JsonValue | null;
}

export interface CreateProjectInput {
  title: string;
  description?: string | null;
  currentDbml?: string;
  layoutMetadata?: JsonValue | null;
}

export interface CloneProjectInput {
  title?: string;
  description?: string | null;
}

export interface UpdateProjectDetailsInput {
  title?: string;
  description?: string | null;
}

export interface UpdateProjectDbmlInput {
  currentDbml: string;
  crdtState?: Uint8Array | null;
  layoutMetadata?: JsonValue | null;
}
