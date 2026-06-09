import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Upload, Sparkles, History, FileAudio, FileText, Wand2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { currentPeriod, formatDuration } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — VoiceFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const period = currentPeriod();
      const [rec, gen, usage, recent] = await Promise.all([
        supabase.from("recordings").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("ai_outputs").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("usage_counters").select("*").eq("user_id", user!.id).eq("period", period).maybeSingle(),
        supabase.from("recordings").select("id,title,duration_seconds,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        totalRecordings: rec.count ?? 0,
        totalGenerations: gen.count ?? 0,
        monthRecordings: usage.data?.recordings_count ?? 0,
        monthGenerations: usage.data?.generations_count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  const planLimitRec = 10;
  const planLimitGen = 20;
  const remainingRec = Math.max(0, planLimitRec - (data?.monthRecordings ?? 0));
  const remainingGen = Math.max(0, planLimitGen - (data?.monthGenerations ?? 0));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture your thoughts. Let AI shape the deliverable.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total recordings" value={data?.totalRecordings ?? 0} icon={FileAudio} />
        <StatCard label="Total AI generations" value={data?.totalGenerations ?? 0} icon={Sparkles} />
        <StatCard
          label="This month"
          value={`${data?.monthRecordings ?? 0} / ${planLimitRec}`}
          icon={Zap}
          progress={Math.min(100, ((data?.monthRecordings ?? 0) / planLimitRec) * 100)}
        />
        <StatCard
          label="Credits remaining"
          value={`${remainingRec} rec · ${remainingGen} gen`}
          icon={Wand2}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <QuickAction to="/record" icon={Mic} title="New recording" desc="Record voice in your browser" primary />
          <QuickAction to="/record" icon={Upload} title="Upload audio" desc="mp3, wav, m4a, ogg" />
          <QuickAction to="/studio" icon={Sparkles} title="AI Studio" desc="Transform transcripts" />
          <QuickAction to="/history" icon={History} title="View history" desc="Browse past work" />
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <Card className="mt-3 divide-y divide-border overflow-hidden p-0">
          {data?.recent.length ? (
            data.recent.map((r) => (
              <Link
                key={r.id}
                to="/studio/$id"
                params={{ id: r.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary"
              >
                <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.title ?? "Untitled recording"}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(r.duration_seconds ?? 0)} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No recordings yet.{" "}
              <Link to="/record" className="font-medium text-primary hover:underline">Make your first one →</Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, progress }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; progress?: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {typeof progress === "number" && <Progress value={progress} className="mt-3 h-1.5" />}
    </Card>
  );
}

function QuickAction({ to, icon: Icon, title, desc, primary }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; primary?: boolean }) {
  return (
    <Link to={to}>
      <Card className={`group h-full cursor-pointer p-5 transition-all hover:shadow-elevated ${primary ? "border-primary/20 bg-accent/30" : ""}`}>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${primary ? "bg-gradient-hero text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-3 font-semibold">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
      </Card>
    </Link>
  );
}
