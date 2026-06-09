import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy, Download, Sparkles, Loader2, Save, RotateCw, Volume2, Pause as PauseIcon, FileText, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OUTPUT_TYPES, type OutputTypeId } from "@/lib/output-types";
import { generateContent, suggestOutputs } from "@/lib/ai.functions";
import { textToSpeech, ELEVEN_VOICES } from "@/lib/tts.functions";
import { currentPeriod } from "@/lib/format";

export const Route = createFileRoute("/_app/studio/$id")({
  head: () => ({ meta: [{ title: "AI Studio — VoiceFlow" }] }),
  component: StudioDetail,
});

function StudioDetail() {
  const { id } = useParams({ from: "/_app/studio/$id" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const generate = useServerFn(generateContent);
  const suggest = useServerFn(suggestOutputs);
  const speak = useServerFn(textToSpeech);

  const [transcriptText, setTranscriptText] = useState("");
  const [savingTranscript, setSavingTranscript] = useState(false);

  const [selectedType, setSelectedType] = useState<OutputTypeId>("email");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [outputId, setOutputId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; reason: string }>>([]);

  const [voiceId, setVoiceId] = useState(ELEVEN_VOICES[0].id);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Load transcript
  const { data: transcript } = useQuery({
    queryKey: ["transcript", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("id,text,language,recording_id,recordings(title,storage_path)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (transcript?.text != null) setTranscriptText(transcript.text);
  }, [transcript?.text]);

  // Suggestions
  useEffect(() => {
    if (transcript?.text && transcript.text.length > 20 && suggestions.length === 0) {
      suggest({ data: { transcript: transcript.text } })
        .then((r) => setSuggestions(r.suggestions))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript?.text]);

  // Existing outputs for this transcript
  const { data: pastOutputs } = useQuery({
    queryKey: ["outputs", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_outputs")
        .select("id,output_type,title,content,created_at")
        .eq("transcript_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const recordingTitle = Array.isArray(transcript?.recordings)
    ? transcript?.recordings[0]?.title
    : transcript?.recordings?.title;

  async function saveTranscript() {
    setSavingTranscript(true);
    try {
      const { error } = await supabase.from("transcripts").update({ text: transcriptText }).eq("id", id);
      if (error) throw error;
      toast.success("Transcript saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingTranscript(false);
    }
  }

  function downloadTranscript() {
    const blob = new Blob([transcriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recordingTitle || "transcript"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runGenerate() {
    if (!user || !transcriptText.trim()) {
      toast.error("Transcript is empty");
      return;
    }
    const def = OUTPUT_TYPES.find((o) => o.id === selectedType)!;
    setGenerating(true);
    setOutput("");
    setAudioUrl(null);
    try {
      const result = await generate({
        data: {
          transcript: transcriptText,
          outputType: selectedType,
          systemPrompt: def.system,
          customInstructions: customInstructions || undefined,
        },
      });
      setOutput(result.content);

      // Persist
      const { data: row, error } = await supabase
        .from("ai_outputs")
        .insert({
          user_id: user.id,
          transcript_id: id,
          output_type: selectedType,
          title: def.label,
          content: result.content,
          prompt_used: customInstructions || def.system,
          model: result.model,
        })
        .select("id")
        .single();
      if (error) throw error;
      setOutputId(row.id);

      // Bump usage
      const period = currentPeriod();
      const { data: existing } = await supabase
        .from("usage_counters")
        .select("id,generations_count")
        .eq("user_id", user.id)
        .eq("period", period)
        .maybeSingle();
      if (existing) {
        await supabase.from("usage_counters").update({ generations_count: existing.generations_count + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("usage_counters").insert({ user_id: user.id, period, generations_count: 1 });
      }

      qc.invalidateQueries({ queryKey: ["outputs", id] });
      toast.success(`${def.label} ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function saveEditedOutput() {
    if (!outputId) return;
    const { error } = await supabase.from("ai_outputs").update({ content: output }).eq("id", outputId);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    toast.success("Copied");
  }

  function downloadOutput() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runTts() {
    if (!output.trim()) return;
    setTtsLoading(true);
    try {
      const r = await speak({ data: { text: output.slice(0, 4000), voiceId } });
      const dataUrl = `data:${r.mimeType};base64,${r.audio}`;
      setAudioUrl(dataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "TTS failed");
    } finally {
      setTtsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <Link to="/studio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to transcripts
      </Link>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {recordingTitle || "AI Studio"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Refine your transcript, then transform it with AI.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transcript */}
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Transcript
            </h2>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(transcriptText); toast.success("Copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadTranscript}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={saveTranscript} disabled={savingTranscript}>
                {savingTranscript ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <Textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            className="min-h-[320px] flex-1 resize-none font-sans text-sm leading-relaxed"
            placeholder="Your transcript will appear here…"
          />
        </Card>

        {/* AI panel */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Studio
          </h2>

          {suggestions.length > 0 && (
            <div className="mt-3 rounded-lg border border-accent bg-accent/30 p-3">
              <div className="text-xs font-medium text-accent-foreground">Suggestions for this transcript:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedType(s.id as OutputTypeId)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-secondary"
                    title={s.reason}
                  >
                    {OUTPUT_TYPES.find((o) => o.id === s.id)?.label ?? s.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Output type</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as OutputTypeId)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.icon} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType === "custom" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Custom instructions</label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="E.g. 'Turn this into a formal letter to a customer apologizing for the delay.'"
                  className="mt-1 min-h-[80px] text-sm"
                />
              </div>
            )}

            <Button onClick={runGenerate} disabled={generating} className="w-full gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>

          {(output || generating) && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={copyOutput}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={downloadOutput}><Download className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={saveEditedOutput} disabled={!outputId}><Save className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={runGenerate} disabled={generating}><RotateCw className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="min-h-[280px] resize-none text-sm leading-relaxed"
                placeholder={generating ? "Thinking…" : ""}
              />

              {/* TTS */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ELEVEN_VOICES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={runTts} disabled={ttsLoading || !output.trim()} className="gap-2">
                  {ttsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                  Listen
                </Button>
                {audioUrl && (
                  <>
                    <audio src={audioUrl} controls className="h-9 flex-1" />
                    <a href={audioUrl} download={`voiceflow-${Date.now()}.mp3`}>
                      <Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Past outputs */}
      {(pastOutputs?.length ?? 0) > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Previously generated</h3>
          <Tabs defaultValue={pastOutputs![0].id}>
            <TabsList className="flex h-auto flex-wrap justify-start">
              {pastOutputs!.map((o) => (
                <TabsTrigger key={o.id} value={o.id} className="text-xs">
                  {OUTPUT_TYPES.find((t) => t.id === o.output_type)?.icon ?? "📄"}{" "}
                  {o.title || o.output_type}
                </TabsTrigger>
              ))}
            </TabsList>
            {pastOutputs!.map((o) => (
              <TabsContent key={o.id} value={o.id}>
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-secondary p-4 text-sm leading-relaxed">
                  {o.content}
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
    </div>
  );
}
