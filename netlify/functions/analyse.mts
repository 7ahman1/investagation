import type { Config, Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { type: string; text: string }) => b.text)
    .join("");

  return Response.json({ text });
};

export const config: Config = {
  path: "/api/analyse",
};
