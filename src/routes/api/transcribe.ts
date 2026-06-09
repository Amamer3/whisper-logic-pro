import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), { status: 500 });
        }

        // Auth check
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        if (!token) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseAnon = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const userClient = createClient(supabaseUrl, supabaseAnon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: { user }, error: userErr } = await userClient.auth.getUser();
        if (userErr || !user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Read incoming multipart
        const form = await request.formData();
        const fileEntry = form.get("file") as unknown;
        const languageCode = (form.get("language") as string) || "";
        const isBlobLike =
          typeof fileEntry === "object" &&
          fileEntry !== null &&
          typeof (fileEntry as Blob).arrayBuffer === "function";
        if (!isBlobLike) {
          return new Response(JSON.stringify({ error: "Missing file" }), { status: 400 });
        }
        const file = fileEntry as Blob & { name?: string };

        // Forward to ElevenLabs
        const ev = new FormData();
        ev.append("file", file, file.name ?? "audio.webm");
        ev.append("model_id", "scribe_v2");
        ev.append("tag_audio_events", "true");
        ev.append("diarize", "true");
        if (languageCode) ev.append("language_code", languageCode);

        const evRes = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: ev,
        });

        if (!evRes.ok) {
          const txt = await evRes.text();
          return new Response(
            JSON.stringify({ error: `Transcription failed: ${txt.slice(0, 300)}` }),
            { status: evRes.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const result = (await evRes.json()) as { text?: string; language_code?: string };
        return new Response(
          JSON.stringify({
            text: result.text ?? "",
            language: result.language_code ?? null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
