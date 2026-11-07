-- Add metadata column to approved_facts for embedding model lineage tracking
ALTER TABLE "approved_facts" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;

