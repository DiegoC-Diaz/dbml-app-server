CREATE TYPE "project_role" AS ENUM (
  'viewer',
  'editor',
  'copier'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "username" varchar(50) UNIQUE NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255),
  "github_id" varchar(100) UNIQUE,
  "email_verified" bool NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "is_active" bool NOT NULL DEFAULT true
);

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY,
  "owner_user_id" uuid NOT NULL,
  "title" varchar(150) NOT NULL,
  "description" varchar(500),
  "created_by" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "is_active" bool NOT NULL DEFAULT true
);

CREATE TABLE "projects_users" (
  "id" uuid PRIMARY KEY,
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" project_role NOT NULL DEFAULT 'viewer',
  "created_by" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now()),
  "is_active" bool NOT NULL DEFAULT true
);

COMMENT ON COLUMN "users"."password_hash" IS 'Hash seguro (Argon2/bcrypt). Nulo si el inicio es con GitHub';

COMMENT ON COLUMN "users"."github_id" IS 'Identificador único de la cuenta en GitHub';

ALTER TABLE "projects" ADD FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects_users" ADD FOREIGN KEY ("project_id") REFERENCES "projects" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects_users" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "projects_users" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

