-- 1. Purge invalid self-conflict records where rule_a_id = rule_b_id
DELETE FROM "guideline_conflicts"
WHERE "rule_a_id" = "rule_b_id";
--> statement-breakpoint
-- 2. Deduplicate existing rows using canonical pair identity (preserving oldest by created_at, then id)
DELETE FROM "guideline_conflicts"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY LEAST("rule_a_id", "rule_b_id"), GREATEST("rule_a_id", "rule_b_id"), "conflict_type"
      ORDER BY "created_at" ASC, "id" ASC
    ) AS rnum
    FROM "guideline_conflicts"
  ) duplicates
  WHERE duplicates.rnum > 1
);
--> statement-breakpoint
-- 3. Normalize existing rule pairs so rule_a_id < rule_b_id
UPDATE "guideline_conflicts"
SET "rule_a_id" = "rule_b_id",
    "rule_b_id" = "rule_a_id"
WHERE "rule_a_id" > "rule_b_id";
--> statement-breakpoint
-- 4. Enforce strict canonical pair ordering for future inserts at database level
ALTER TABLE "guideline_conflicts"
ADD CONSTRAINT "check_conflicts_canonical_order"
CHECK ("rule_a_id" < "rule_b_id");
--> statement-breakpoint
-- 5. Create unique index on canonical pair and conflict type
CREATE UNIQUE INDEX "idx_conflicts_unique_pair" ON "guideline_conflicts" USING btree ("rule_a_id","rule_b_id","conflict_type");
