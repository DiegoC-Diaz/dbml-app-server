import { readFileSync } from 'node:fs';
import { z } from 'zod';

const appConfigSchema = z.object({
  projects: z.object({
    defaultTitle: z.string().trim().min(1).max(150),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

function loadAppConfig(): AppConfig {
  const configUrl = new URL('../../index.json', import.meta.url);
  const raw = readFileSync(configUrl, 'utf-8');
  return appConfigSchema.parse(JSON.parse(raw) as unknown);
}

export const appConfig: Readonly<AppConfig> = loadAppConfig();
