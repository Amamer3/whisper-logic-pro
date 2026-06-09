import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Square, Pause, Play, Upload, Trash2, Loader2, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration, currentPeriod } from "@/lib/format";

export const Route = createFileRoute("/_app/record")({
  head: () => ({ meta: [{ title: "New Recording — VoiceFlow" }] }),
  component: RecordPage,
});

type Phase = "idle" | "recording" | "paused" | "review" | "uploading";

function RecordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("audio/webm");
  const [levels, setLevels] = useState<number[]>(Array(48).fill(0.05));
  const [title, setTitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startVisualizer = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteTimeDomainData(buf);
      let max = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i] - 128) / 128;
        if (v > max) max = v;
      }
      setLevels((prev) => {
        const next = prev.slice(1);
        next.push(Math.max(0.05, Math.min(1, max * 1.5)));
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
      const mt = preferred.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const mr = mt ? new MediaRecorder(stream, { mimeType: mt }) : new MediaRecorder(stream);
      setMimeType(mr.mimeType || "audio/webm");
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
      };
      mediaRecorderRef.current = mr;
      mr.start(250);
      setPhase("recording");
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      startVisualizer(stream);
    } catch (err) {
      toast.error("Microphone access denied");
      console.error(err);
    }
  };

  const pause = () => {
    mediaRecorderRef.current?.pause();
    if (tickRef.current) clearInterval(tickRef.current);
    setPhase("paused");
  };

  const resume = () => {
    mediaRecorderRef.current?.resume();
    tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setPhase("recording");
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    cleanup();
    setPhase("review");
  };

  const discard = () => {
    setBlob(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setSeconds(0);
    setLevels(Array(48).fill(0.05));
    setPhase("idle");
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm", "audio/aac"];
    if (!allowed.includes(f.type) && !/\.(mp3|wav|m4a|ogg|webm)$/i.test(f.name)) {
      toast.error("Unsupported audio format. Use mp3, wav, m4a, or ogg.");
      return;
    }
    setBlob(f);
    setMimeType(f.type || "audio/mpeg");
    setBlobUrl(URL.createObjectURL(f));
    setTitle(f.name.replace(/\.[^.]+$/, ""));
    setPhase("review");
    setSeconds(0);
  };

  const submit = async () => {
    if (!blob || !user) return;
    setPhase("uploading");
    try {
      // 1. Upload to storage
      const ext = mimeType.includes("mp4") ? "m4a"
        : mimeType.includes("mpeg") ? "mp3"
        : mimeType.includes("wav") ? "wav"
        : mimeType.includes("ogg") ? "ogg"
        : "webm";
      const filename = `${Date.now()}.${ext}`;
      const storagePath = `${user.id}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from("recordings")
        .upload(storagePath, blob, { contentType: mimeType, upsert: false });
      if (upErr) throw upErr;

      // 2. Insert recording row
      const recTitle = title.trim() || `Recording ${new Date().toLocaleString()}`;
      const { data: rec, error: recErr } = await supabase
        .from("recordings")
        .insert({
          user_id: user.id,
          title: recTitle,
          storage_path: storagePath,
          mime_type: mimeType,
          duration_seconds: seconds || null,
          size_bytes: blob.size,
          source: phase === "uploading" ? "recording" : "recording",
        })
        .select("id")
        .single();
      if (recErr) throw recErr;

      // 3. Transcribe via API route
      const { data: { session } } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append("file", blob, `audio.${ext}`);
      const resp = await fetch("/api/transcribe", {
        method: "POST",
        body: fd,
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Transcription failed" }));
        throw new Error(err.error || "Transcription failed");
      }
      const { text, language } = (await resp.json()) as { text: string; language: string | null };

      // 4. Insert transcript
      const { data: tx, error: txErr } = await supabase
        .from("transcripts")
        .insert({
          user_id: user.id,
          recording_id: rec.id,
          text: text || "",
          language,
          model: "elevenlabs/scribe_v2",
        })
        .select("id")
        .single();
      if (txErr) throw txErr;

      // 5. Bump usage counter
      const period = currentPeriod();
      const { data: existing } = await supabase
        .from("usage_counters")
        .select("id,recordings_count")
        .eq("user_id", user.id)
        .eq("period", period)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("usage_counters")
          .update({ recordings_count: existing.recordings_count + 1 })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("usage_counters")
          .insert({ user_id: user.id, period, recordings_count: 1 });
      }

      toast.success("Transcript ready!");
      navigate({ to: "/studio/$id", params: { id: tx.id } });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPhase("review");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">New recording</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Record in your browser or upload an audio file. We'll transcribe and send you to the AI Studio.
        </p>
      </div>

      <Card className="p-8">
        {/* Waveform */}
        <div className="flex h-32 items-center justify-center gap-1 rounded-xl bg-secondary px-4">
          {levels.map((v, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-primary transition-all"
              style={{
                height: `${Math.max(6, v * 100)}%`,
                opacity: phase === "recording" ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="mt-6 text-center">
          <div className="font-mono text-4xl font-semibold tabular-nums">{formatDuration(seconds)}</div>
          <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
            {phase === "idle" && "Ready to record"}
            {phase === "recording" && "Recording…"}
            {phase === "paused" && "Paused"}
            {phase === "review" && "Review"}
            {phase === "uploading" && "Processing…"}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {phase === "idle" && (
            <>
              <Button onClick={start} size="lg" className="gap-2">
                <Mic className="h-5 w-5" /> Start recording
              </Button>
              <label>
                <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" className="sr-only" onChange={onUpload} />
                <Button asChild variant="outline" size="lg">
                  <span className="cursor-pointer"><Upload className="h-4 w-4" /> Upload audio</span>
                </Button>
              </label>
            </>
          )}
          {phase === "recording" && (
            <>
              <Button onClick={pause} variant="outline" size="lg" className="gap-2">
                <Pause className="h-5 w-5" /> Pause
              </Button>
              <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
                <Square className="h-5 w-5" /> Stop
              </Button>
            </>
          )}
          {phase === "paused" && (
            <>
              <Button onClick={resume} size="lg" className="gap-2">
                <Play className="h-5 w-5" /> Resume
              </Button>
              <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
                <Square className="h-5 w-5" /> Stop
              </Button>
            </>
          )}
          {phase === "review" && blobUrl && (
            <div className="w-full space-y-4">
              <audio src={blobUrl} controls className="w-full" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={submit} size="lg" className="gap-2">
                  <AudioWaveform className="h-4 w-4" /> Transcribe & open Studio
                </Button>
                <Button onClick={discard} variant="outline" size="lg" className="gap-2">
                  <Trash2 className="h-4 w-4" /> Discard
                </Button>
              </div>
            </div>
          )}
          {phase === "uploading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading & transcribing (this can take a few seconds)…
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
