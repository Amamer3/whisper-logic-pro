import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Mic, Sparkles, FileText, Zap, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceFlow — AI Voice Productivity Assistant" },
      { name: "description", content: "Record voice notes and let AI turn them into emails, meeting notes, tasks, reports, and summaries — in seconds." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-elevated">
              <Mic className="h-4 w-4" />
            </span>
            <span>VoiceFlow</span>
          </Link>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Powered by Lovable AI + ElevenLabs
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Speak your thoughts.{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">Ship the work.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            VoiceFlow records and transcribes your voice, then turns it into polished emails,
            meeting minutes, task lists, reports, and summaries — automatically.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="gap-2">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">See pricing</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free plan — no credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Mic, title: "Record or upload", desc: "Browser recorder with waveform and timer, plus mp3/wav/m4a/ogg upload support." },
              { icon: FileText, title: "Instant transcripts", desc: "ElevenLabs Scribe turns audio into accurate, editable text in seconds." },
              { icon: Zap, title: "AI Studio", desc: "One click to convert into emails, meeting notes, tasks, blog drafts, and more." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["1", "Record", "Tap the mic and speak naturally. Pause, resume, re-record."],
            ["2", "Transcribe", "Audio is securely sent to ElevenLabs and returned as text."],
            ["3", "Transform", "Pick an output template and let AI shape it into your final deliverable."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl border border-border p-6">
              <div className="text-sm font-medium text-primary">Step {n}</div>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop typing what you already said.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands shipping faster with their voice.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg">Create your free account</Button>
            </Link>
          </div>
          <ul className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {["10 recordings/mo free", "No credit card", "Cancel anytime"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} VoiceFlow</span>
          <div className="flex gap-4">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
