CREATE TABLE "answers" (
	"id" serial PRIMARY KEY,
	"interview_id" integer NOT NULL,
	"question_id" text NOT NULL,
	"text" text,
	"flag" text,
	"answered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"role" text DEFAULT 'Staff' NOT NULL,
	"case_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"analysis_result" text,
	"analysis_run_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_interview_id_interviews_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE;