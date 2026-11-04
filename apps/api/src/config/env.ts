import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first, then local .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().default('postgresql://evolyn:evolyn_secret@localhost:5432/evolyn_db'),

  // Gemini AI Model Configuration (strictly environment-driven)
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),

  // AWS S3 (optional in Phase 1 / local fallback)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().default('evolyn-guidelines-storage'),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
