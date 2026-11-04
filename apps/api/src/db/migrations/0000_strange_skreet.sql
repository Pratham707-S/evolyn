CREATE TABLE "approved_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(100) NOT NULL,
	"claim_statement" text NOT NULL,
	"approved_proof_source" text NOT NULL,
	"valid_until" timestamp with time zone,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"channel" varchar(50) DEFAULT 'WEBSITE' NOT NULL,
	"raw_text" text NOT NULL,
	"file_url" text,
	"submitted_by" varchar(100) DEFAULT 'Judge / Reviewer' NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"decision" varchar(30) NOT NULL,
	"reviewer_name" varchar(100) NOT NULL,
	"comments" text NOT NULL,
	"overridden_issue_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detected_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_run_id" uuid NOT NULL,
	"rule_id" uuid,
	"fact_id" uuid,
	"issue_type" varchar(50) NOT NULL,
	"flagged_excerpt" text NOT NULL,
	"char_start" integer,
	"char_end" integer,
	"explanation" text NOT NULL,
	"suggested_fix" text DEFAULT '' NOT NULL,
	"source_quote" text NOT NULL,
	"confidence_score" real DEFAULT 1 NOT NULL,
	"evidence_strength_score" real DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guideline_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_a_id" uuid NOT NULL,
	"rule_b_id" uuid NOT NULL,
	"conflict_type" varchar(50) NOT NULL,
	"explanation" text NOT NULL,
	"severity" varchar(20) DEFAULT 'WARNING' NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guideline_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guideline_id" uuid NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"rule_statement" text NOT NULL,
	"explanation" text DEFAULT '' NOT NULL,
	"severity" varchar(20) DEFAULT 'WARNING' NOT NULL,
	"embedding" vector(768),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"raw_content" text NOT NULL,
	"s3_url" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"violation_count" integer DEFAULT 1 NOT NULL,
	"sample_excerpts" jsonb DEFAULT '[]'::jsonb,
	"suggested_guideline_revision" text,
	"status" varchar(30) DEFAULT 'PENDING_REVIEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"overall_compliance_score" real DEFAULT 0 NOT NULL,
	"total_issues_count" integer DEFAULT 0 NOT NULL,
	"model_used" varchar(100) NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_submission_id_content_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."content_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_issues" ADD CONSTRAINT "detected_issues_review_run_id_review_runs_id_fk" FOREIGN KEY ("review_run_id") REFERENCES "public"."review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_issues" ADD CONSTRAINT "detected_issues_rule_id_guideline_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."guideline_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detected_issues" ADD CONSTRAINT "detected_issues_fact_id_approved_facts_id_fk" FOREIGN KEY ("fact_id") REFERENCES "public"."approved_facts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guideline_conflicts" ADD CONSTRAINT "guideline_conflicts_rule_a_id_guideline_rules_id_fk" FOREIGN KEY ("rule_a_id") REFERENCES "public"."guideline_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guideline_conflicts" ADD CONSTRAINT "guideline_conflicts_rule_b_id_guideline_rules_id_fk" FOREIGN KEY ("rule_b_id") REFERENCES "public"."guideline_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guideline_rules" ADD CONSTRAINT "guideline_rules_guideline_id_guidelines_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_mistakes" ADD CONSTRAINT "recurring_mistakes_rule_id_guideline_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."guideline_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_runs" ADD CONSTRAINT "review_runs_submission_id_content_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."content_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_facts_topic" ON "approved_facts" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "content_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_submissions_created_at" ON "content_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_decisions_submission_id" ON "decisions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_detected_issues_review_run" ON "detected_issues" USING btree ("review_run_id");--> statement-breakpoint
CREATE INDEX "idx_detected_issues_rule_id" ON "detected_issues" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_detected_issues_status" ON "detected_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_conflicts_rule_a" ON "guideline_conflicts" USING btree ("rule_a_id");--> statement-breakpoint
CREATE INDEX "idx_conflicts_rule_b" ON "guideline_conflicts" USING btree ("rule_b_id");--> statement-breakpoint
CREATE INDEX "idx_conflicts_status" ON "guideline_conflicts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rules_guideline_id" ON "guideline_rules" USING btree ("guideline_id");--> statement-breakpoint
CREATE INDEX "idx_rules_rule_type" ON "guideline_rules" USING btree ("rule_type");--> statement-breakpoint
CREATE INDEX "idx_rules_severity" ON "guideline_rules" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_guidelines_status" ON "guidelines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_guidelines_category" ON "guidelines" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_recurring_mistakes_rule_id" ON "recurring_mistakes" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_recurring_mistakes_count" ON "recurring_mistakes" USING btree ("violation_count");--> statement-breakpoint
CREATE INDEX "idx_review_runs_submission_id" ON "review_runs" USING btree ("submission_id");
