import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), { status: 500 });
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

        const oai = new FormData();
        oai.append("file", file, file.name ?? "audio.webm");
        oai.append("model", "whisper-1");
        oai.append("response_format", "verbose_json");
        if (languageCode) oai.append("language", languageCode);

        const oaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: oai,
        });

        if (!oaiRes.ok) {
          const txt = await oaiRes.text();
          let message = `Transcription failed (${oaiRes.status})`;
          try {
            const parsed = JSON.parse(txt) as { error?: { message?: string } };
            if (parsed.error?.message) message = parsed.error.message;
          } catch {
            if (txt) message = txt.slice(0, 300);
          }
          if (oaiRes.status === 401) {
            message = "OpenAI API key is invalid or expired. Update OPENAI_API_KEY in your .env file.";
          } else if (oaiRes.status === 429) {
            message = "OpenAI rate limit reached. Please try again in a moment.";
          }
          return new Response(JSON.stringify({ error: message }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }

        const result = (await oaiRes.json()) as { text?: string; language?: string };
        return new Response(
          JSON.stringify({
            text: result.text ?? "",
            language: result.language ?? null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
