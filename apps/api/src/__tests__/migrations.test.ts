import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../db/migrations');

describe('Database Migrations Integrity & Hardening', () => {
    it('migration journal is strictly sequential and entries correspond to SQL files', () => {
        const journalPath = path.join(migrationsDir, 'meta/_journal.json');
        assert.ok(fs.existsSync(journalPath), 'meta/_journal.json must exist');

        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
        assert.equal(journal.dialect, 'postgresql');
        assert.ok(Array.isArray(journal.entries));
        assert.equal(journal.entries.length, 2);

        // Verify ordering
        assert.equal(journal.entries[0].idx, 0);
        assert.equal(journal.entries[0].tag, '0000_strange_skreet');

        assert.equal(journal.entries[1].idx, 1);
        assert.equal(journal.entries[1].tag, '0001_add_conflicts_unique_index');

        // Verify corresponding SQL file exists on disk
        const migration1Path = path.join(migrationsDir, '0001_add_conflicts_unique_index.sql');
        assert.ok(fs.existsSync(migration1Path), '0001_add_conflicts_unique_index.sql must exist on disk');
    });

    it('0001 migration contains self-conflict purge, deduplication, normalization, strict check constraint, and unique index', () => {
        const migration1Path = path.join(migrationsDir, '0001_add_conflicts_unique_index.sql');
        const sqlContent = fs.readFileSync(migration1Path, 'utf8');

        // Step 1: Purge self-conflicts
        assert.ok(
            sqlContent.includes('DELETE FROM "guideline_conflicts"\nWHERE "rule_a_id" = "rule_b_id"'),
            'Must purge self-conflict records where rule_a_id = rule_b_id',
        );

        // Step 2: Deduplication query with LEAST and GREATEST
        assert.ok(sqlContent.includes('DELETE FROM "guideline_conflicts"'), 'Must delete duplicate rows');
        assert.ok(sqlContent.includes('LEAST("rule_a_id", "rule_b_id")'), 'Must partition by LEAST rule ID');
        assert.ok(sqlContent.includes('GREATEST("rule_a_id", "rule_b_id")'), 'Must partition by GREATEST rule ID');
        assert.ok(sqlContent.includes('ORDER BY "created_at" ASC, "id" ASC'), 'Must preserve oldest record');

        // Step 3: Normalization
        assert.ok(sqlContent.includes('UPDATE "guideline_conflicts"'), 'Must update remaining un-normalized pairs');
        assert.ok(sqlContent.includes('WHERE "rule_a_id" > "rule_b_id"'), 'Must swap where rule_a_id > rule_b_id');

        // Step 4: Strict check constraint for canonical order (strict inequality: rule_a_id < rule_b_id)
        assert.ok(
            sqlContent.includes('ADD CONSTRAINT "check_conflicts_canonical_order"'),
            'Must add canonical check constraint',
        );
        assert.ok(
            sqlContent.includes('CHECK ("rule_a_id" < "rule_b_id")'),
            'Check constraint must strictly enforce rule_a_id < rule_b_id',
        );

        // Step 5: Unique index
        assert.ok(
            sqlContent.includes('CREATE UNIQUE INDEX "idx_conflicts_unique_pair"'),
            'Must create unique index on guideline_conflicts',
        );
        assert.ok(
            sqlContent.includes('("rule_a_id","rule_b_id","conflict_type")'),
            'Unique index must cover rule_a_id, rule_b_id, conflict_type',
        );

        // Statement breakpoints
        const breakpoints = sqlContent.split('--> statement-breakpoint');
        assert.equal(breakpoints.length, 5, 'Must have 5 breakpoint-separated statements for Drizzle migrator');
    });
});
