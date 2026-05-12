import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { interviews, answers } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request) => {
  const url = new URL(req.url);
  const segments = url.pathname.replace("/api/interviews", "").split("/").filter(Boolean);
  const interviewId = segments[0] ? parseInt(segments[0], 10) : null;
  const subResource = segments[1] || null;

  if (req.method === "GET" && !interviewId) {
    const rows = await db
      .select()
      .from(interviews)
      .orderBy(desc(interviews.createdAt));

    const result = [];
    for (const row of rows) {
      const answerRows = await db
        .select()
        .from(answers)
        .where(eq(answers.interviewId, row.id));

      const answersMap: Record<string, { text: string | null; flag: string | null; answeredAt: string | null }> = {};
      for (const a of answerRows) {
        answersMap[a.questionId] = {
          text: a.text,
          flag: a.flag,
          answeredAt: a.answeredAt ? a.answeredAt.toISOString() : null,
        };
      }

      result.push({
        id: row.id,
        name: row.name,
        role: row.role,
        caseId: row.caseId,
        startedAt: row.startedAt.toISOString(),
        analysisResult: row.analysisResult,
        analysisRunAt: row.analysisRunAt ? row.analysisRunAt.toISOString() : null,
        answers: answersMap,
      });
    }

    return Response.json(result);
  }

  if (req.method === "GET" && interviewId) {
    const [row] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId));

    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    const answerRows = await db
      .select()
      .from(answers)
      .where(eq(answers.interviewId, row.id));

    const answersMap: Record<string, { text: string | null; flag: string | null; answeredAt: string | null }> = {};
    for (const a of answerRows) {
      answersMap[a.questionId] = {
        text: a.text,
        flag: a.flag,
        answeredAt: a.answeredAt ? a.answeredAt.toISOString() : null,
      };
    }

    return Response.json({
      id: row.id,
      name: row.name,
      role: row.role,
      caseId: row.caseId,
      startedAt: row.startedAt.toISOString(),
      analysisResult: row.analysisResult,
      analysisRunAt: row.analysisRunAt ? row.analysisRunAt.toISOString() : null,
      answers: answersMap,
    });
  }

  if (req.method === "POST" && !interviewId) {
    const { name, role, caseId } = await req.json();
    if (!name || !caseId) {
      return Response.json({ error: "name and caseId are required" }, { status: 400 });
    }

    const [row] = await db
      .insert(interviews)
      .values({ name, role: role || "Staff", caseId })
      .returning();

    return Response.json({
      id: row.id,
      name: row.name,
      role: row.role,
      caseId: row.caseId,
      startedAt: row.startedAt.toISOString(),
      analysisResult: row.analysisResult,
      analysisRunAt: row.analysisRunAt ? row.analysisRunAt.toISOString() : null,
      answers: {},
    }, { status: 201 });
  }

  if (req.method === "PUT" && interviewId && subResource === "answers") {
    const { questionId, text: ansText, flag } = await req.json();
    if (!questionId) {
      return Response.json({ error: "questionId is required" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(answers)
      .where(eq(answers.interviewId, interviewId))
      .then((rows) => rows.find((r) => r.questionId === questionId));

    const now = new Date();

    if (existing) {
      await db
        .update(answers)
        .set({ text: ansText ?? null, flag: flag ?? null, answeredAt: now })
        .where(eq(answers.id, existing.id));
    } else {
      await db.insert(answers).values({
        interviewId,
        questionId,
        text: ansText ?? null,
        flag: flag ?? null,
        answeredAt: now,
      });
    }

    return Response.json({ ok: true, answeredAt: now.toISOString() });
  }

  if (req.method === "PUT" && interviewId && subResource === "analysis") {
    const { analysisResult } = await req.json();

    await db
      .update(interviews)
      .set({ analysisResult, analysisRunAt: new Date() })
      .where(eq(interviews.id, interviewId));

    return Response.json({ ok: true });
  }

  if (req.method === "DELETE" && interviewId) {
    await db.delete(interviews).where(eq(interviews.id, interviewId));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: [
    "/api/interviews",
    "/api/interviews/:id",
    "/api/interviews/:id/answers",
    "/api/interviews/:id/analysis",
  ],
};
