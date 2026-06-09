import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cleanAiOutputText } from "@/lib/format-ai-output";

const DEFAULT_MODEL = "gpt-4o-mini";

async function openaiChatCompletion(
  messages: Array<{ role: "system" | "user"; content: string }>,
  model = DEFAULT_MODEL,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
    if (res.status === 401) throw new Error("OpenAI API key is invalid or expired.");
    throw new Error(`AI generation failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

const GenInput = z.object({
  transcript: z.string().min(1).max(50_000),
  outputType: z.string().min(1).max(64),
  systemPrompt: z.string().min(1).max(4000),
  customInstructions: z.string().max(2000).optional(),
  model: z.string().optional(),
});

/**
 * Generate AI content from a transcript using OpenAI.
 * Returns generated text. The caller is responsible for persisting the result.
 */
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenInput.parse(data))
  .handler(async ({ data }) => {
    const model = data.model || DEFAULT_MODEL;

    const systemPrompt =
      `You are VoiceFlow's writing assistant. Transform spoken transcripts into polished written deliverables.\n\n` +
      `Task: ${data.systemPrompt}\n\n` +
      (data.customInstructions ? `Additional user instructions:\n${data.customInstructions}\n\n` : "") +
      `Rules:\n- Preserve the speaker's meaning and key facts.\n- Do not invent information.\n- Output only the final content (no preamble, no "here is...").\n\n` +
      `Formatting:\n- Do NOT use markdown (#, ##, **bold**, or code fences).\n- Put the document title on the first line as plain text.\n- Put each section name on its own line in Title Case (e.g. "Attendees", "Discussion").\n- Use "- " for bullet lists; indent nested items with two spaces.\n- Separate sections with a blank line.\n- For unknown values use placeholders like [Not mentioned].`;

    const raw = await openaiChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: data.transcript },
      ],
      model,
    );

    const content = cleanAiOutputText(raw);
    return { content, model };
  });

const SuggestInput = z.object({
  transcript: z.string().min(1).max(50_000),
});

/**
 * Analyze a transcript and suggest 3 output types.
 */
export const suggestOutputs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SuggestInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const text = await openaiChatCompletion([
        {
          role: "system",
          content:
            "Analyze the transcript and recommend the 3 most useful output types from this set: email, meeting_notes, tasks, daily_report, weekly_report, project_update, summary, blog, journal, social. " +
            'Respond with ONLY a compact JSON object like {"suggestions":[{"id":"meeting_notes","reason":"..."},{"id":"tasks","reason":"..."},{"id":"email","reason":"..."}]}. No prose, no markdown.',
        },
        { role: "user", content: data.transcript.slice(0, 8000) },
      ]);

      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { suggestions?: Array<{ id: string; reason: string }> };
      return { suggestions: parsed.suggestions ?? [] };
    } catch {
      return { suggestions: [] as Array<{ id: string; reason: string }> };
    }
  });
