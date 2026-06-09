import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TtsInput = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().default("JBFqnCBsd6RMkjVDRZzb"), // George
  speed: z.number().min(0.7).max(1.2).default(1.0),
});

/**
 * Convert text to speech via ElevenLabs. Returns base64-encoded MP3.
 */
export const textToSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TtsInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${data.voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: data.speed },
        }),
      },
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`TTS failed (${res.status}): ${txt.slice(0, 200)}`);
    }
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { audio: base64, mimeType: "audio/mpeg" };
  });

export const ELEVEN_VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Warm British)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Friendly US)" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (Confident US)" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Calm US)" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica (Expressive US)" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel (Authoritative UK)" },
];
