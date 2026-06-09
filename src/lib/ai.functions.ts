import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenInput = z.object({
  transcript: z.string().min(1).max(50_000),
  outputType: z.string().min(1).max(64),
  systemPrompt: z.string().min(1).max(4000),
  customInstructions: z.string().max(2000).optional(),
  model: z.string().optional(),
});

/**
 * Generate AI content from a transcript using Lovable AI Gateway.
 * Returns generated text. The caller is responsible for persisting the result.
 */
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const model = data.model || "google/gemini-3-flash-preview";

    const systemPrompt =
      `You are VoiceFlow's writing assistant. Transform spoken transcripts into polished written deliverables.\n\n` +
      `Task: ${data.systemPrompt}\n\n` +
      (data.customInstructions ? `Additional user instructions:\n${data.customInstructions}\n\n` : "") +
      `Rules:\n- Preserve the speaker's meaning and key facts.\n- Do not invent information.\n- Output only the final content (no preamble, no "here is...").`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.transcript },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace billing.");
      throw new Error(`AI generation failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Analyze the transcript and recommend the 3 most useful output types from this set: email, meeting_notes, tasks, daily_report, weekly_report, project_update, summary, blog, journal, social. " +
              'Respond with ONLY a compact JSON object like {"suggestions":[{"id":"meeting_notes","reason":"..."},{"id":"tasks","reason":"..."},{"id":"email","reason":"..."}]}. No prose, no markdown.',
          },
          { role: "user", content: data.transcript.slice(0, 8000) },
        ],
      }),
    });
    if (!res.ok) return { suggestions: [] as Array<{ id: string; reason: string }> };

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { suggestions?: Array<{ id: string; reason: string }> };
      return { suggestions: parsed.suggestions ?? [] };
    } catch {
      return { suggestions: [] as Array<{ id: string; reason: string }> };
    }
  });
