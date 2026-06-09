import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/studio/")({
  head: () => ({ meta: [{ title: "AI Studio — VoiceFlow" }] }),
  component: StudioIndex,
});

function StudioIndex() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["transcripts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transcripts")
        .select("id, text, language, created_at, recording_id, recordings(title)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a transcript to transform into an email, meeting notes, tasks, and more.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <Card className="p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            You have no transcripts yet.{" "}
            <Link to="/record" className="font-medium text-primary hover:underline">Make your first recording →</Link>
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data.map((t) => {
            const rec = Array.isArray(t.recordings) ? t.recordings[0] : t.recordings;
            return (
              <Link key={t.id} to="/studio/$id" params={{ id: t.id }}>
                <Card className="cursor-pointer p-4 transition-all hover:shadow-elevated">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {rec?.title ?? "Untitled"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {t.text?.slice(0, 200) || "(empty transcript)"}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                        {t.language ? ` · ${t.language}` : ""}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
