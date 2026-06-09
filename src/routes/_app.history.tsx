import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileAudio, FileText, Sparkles, Trash2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatDuration } from "@/lib/format";
import { toast } from "sonner";
import { OUTPUT_TYPES } from "@/lib/output-types";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — VoiceFlow" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const recordings = useQuery({
    queryKey: ["history-recordings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("recordings")
        .select("id,title,duration_seconds,created_at,source")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const transcripts = useQuery({
    queryKey: ["history-transcripts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transcripts")
        .select("id,text,created_at,recordings(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const outputs = useQuery({
    queryKey: ["history-outputs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_outputs")
        .select("id,title,output_type,content,created_at,transcript_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function deleteItem(table: "recordings" | "transcripts" | "ai_outputs", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["history-recordings"] });
    qc.invalidateQueries({ queryKey: ["history-transcripts"] });
    qc.invalidateQueries({ queryKey: ["history-outputs"] });
  }

  const q = search.toLowerCase();
  const filteredRecs = recordings.data?.filter((r) => !q || r.title?.toLowerCase().includes(q));
  const filteredTx = transcripts.data?.filter((t) => !q || t.text?.toLowerCase().includes(q));
  const filteredOut = outputs.data?.filter((o) =>
    !q || o.title?.toLowerCase().includes(q) || o.content?.toLowerCase().includes(q),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">All your recordings, transcripts, and AI outputs.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="recordings">
        <TabsList>
          <TabsTrigger value="recordings"><FileAudio className="mr-1.5 h-3.5 w-3.5" /> Recordings</TabsTrigger>
          <TabsTrigger value="transcripts"><FileText className="mr-1.5 h-3.5 w-3.5" /> Transcripts</TabsTrigger>
          <TabsTrigger value="outputs"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Outputs</TabsTrigger>
        </TabsList>

        <TabsContent value="recordings" className="mt-4 space-y-2">
          {filteredRecs?.length === 0 && <Empty />}
          {filteredRecs?.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 p-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
                <FileAudio className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.title ?? "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(r.duration_seconds ?? 0)} · {r.source} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => deleteItem("recordings", r.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transcripts" className="mt-4 space-y-2">
          {filteredTx?.length === 0 && <Empty />}
          {filteredTx?.map((t) => {
            const rec = Array.isArray(t.recordings) ? t.recordings[0] : t.recordings;
            return (
              <Card key={t.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to="/studio/$id" params={{ id: t.id }} className="text-sm font-medium hover:underline">
                      {rec?.title ?? "Untitled"}
                    </Link>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.text?.slice(0, 200)}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteItem("transcripts", t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="outputs" className="mt-4 space-y-2">
          {filteredOut?.length === 0 && <Empty />}
          {filteredOut?.map((o) => (
            <Card key={o.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                  <span>{OUTPUT_TYPES.find((t) => t.id === o.output_type)?.icon ?? "✨"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/studio/$id" params={{ id: o.transcript_id ?? "" }} className="text-sm font-medium hover:underline">
                    {o.title ?? o.output_type}
                  </Link>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.content?.slice(0, 200)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteItem("ai_outputs", o.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty() {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">
      Nothing here yet.{" "}
      <Link to="/record" className="font-medium text-primary hover:underline">Make a recording →</Link>
    </Card>
  );
}
