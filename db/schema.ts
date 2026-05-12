import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const interviews = pgTable("interviews", {
  id: serial().primaryKey(),
  name: text().notNull(),
  role: text().notNull().default("Staff"),
  caseId: text("case_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  analysisResult: text("analysis_result"),
  analysisRunAt: timestamp("analysis_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const answers = pgTable("answers", {
  id: serial().primaryKey(),
  interviewId: integer("interview_id")
    .notNull()
    .references(() => interviews.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull(),
  text: text(),
  flag: text(),
  answeredAt: timestamp("answered_at"),
});
