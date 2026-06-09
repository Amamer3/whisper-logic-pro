import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  Mic,
  Sparkles,
  FileText,
  Zap,
  ArrowRight,
  Check,
  Mail,
  ListTodo,
  Users,
  PenLine,
  Upload,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceFlow — AI Voice Productivity Assistant" },
      {
        name: "description",
        content:
          "Record voice notes and let AI turn them into emails, meeting notes, tasks, reports, and summaries — in seconds.",
      },
    ],
  }),
  component: Landing,
});

const OUTPUT_TYPES = [
  { icon: Mail, label: "Emails" },
  { icon: Users, label: "Meeting notes" },
  { icon: ListTodo, label: "Task lists" },
  { icon: FileText, label: "Reports" },
  { icon: PenLine, label: "Blog drafts" },
  { icon: Sparkles, label: "Summaries" },
];

const FEATURES = [
  {
    icon: Mic,
    title: "Record or upload",
    desc: "Capture in the browser with a live waveform, or drop mp3, wav, m4a, and ogg files.",
  },
  {
    icon: FileText,
    title: "Instant transcripts",
    desc: "High-accuracy speech-to-text you can edit inline before transforming.",
  },
  {
    icon: Zap,
    title: "AI Studio",
    desc: "One click to reshape raw speech into polished emails, notes, tasks, and more.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Record",
    desc: "Tap the mic and speak naturally. Pause, resume, or re-record anytime.",
  },
  {
    n: "02",
    title: "Transcribe",
    desc: "Audio is processed securely and returned as clean, editable text.",
  },
  {
    n: "03",
    title: "Transform",
    desc: "Pick a template and let AI shape your words into a finished deliverable.",
  },
];

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elevated">
              <Mic className="h-4 w-4" />
            </span>
            <span>VoiceFlow</span>
          </Link>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <Link to="/pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="shadow-soft">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-mesh relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,var(--color-background)_100%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28 lg:gap-16">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI voice productivity
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Speak your thoughts.{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">Ship the work.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              VoiceFlow records and transcribes your voice, then turns it into polished emails,
              meeting minutes, task lists, reports, and summaries — automatically.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gap-2 shadow-elevated">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  See pricing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free plan — no credit card required</p>
          </div>

          <HeroPreview />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-16">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-left">
            Turn voice into
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {OUTPUT_TYPES.map(({ icon: Icon, label }) => (
              <Badge
                key={label}
                variant="secondary"
                className="gap-1.5 rounded-full border border-border/80 px-3 py-1 font-normal text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to go from voice to done
            </h2>
            <p className="mt-3 text-muted-foreground">
              Capture, transcribe, and transform — without switching tools or retyping what you
              already said.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border/80 bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              Three steps from spoken idea to something you can send, share, or check off.
            </p>
          </div>
          <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            <div
              className="absolute top-8 right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              aria-hidden
            />
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative rounded-2xl border border-border/80 bg-card p-7 shadow-soft">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-sm font-semibold text-primary-foreground shadow-elevated">
                  {n}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <blockquote className="text-xl font-medium leading-relaxed tracking-tight md:text-2xl">
            "I dictate meeting notes on my commute. By the time I'm at my desk, the follow-up
            email is already drafted."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Product lead, fintech startup</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero px-8 py-16 text-center text-primary-foreground shadow-elevated md:px-16">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Stop typing what you already said.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-primary-foreground/85">
                Join professionals who ship faster by letting their voice do the first draft.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-primary shadow-soft hover:bg-white/90"
                  >
                    Create your free account
                  </Button>
                </Link>
              </div>
              <ul className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
                {["10 recordings/mo free", "No credit card", "Cancel anytime"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-hero text-primary-foreground">
              <Mic className="h-3.5 w-3.5" />
            </span>
            <span>© {new Date().getFullYear()} VoiceFlow</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link to="/auth" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  const bars = [3, 5, 8, 12, 16, 20, 14, 18, 10, 6, 9, 15, 11, 7, 4, 8, 13, 17, 9, 5];

  return (
    <div className="relative mx-auto w-full max-w-md md:max-w-none">
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-elevated">
        <div className="flex items-center justify-between border-b border-border/60 bg-secondary/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Mic className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium">New recording</p>
              <p className="text-xs text-muted-foreground">02:34</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-end justify-center gap-[3px] rounded-xl border border-border/60 bg-secondary/30 px-4 py-6">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-primary/70"
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground"
              tabIndex={-1}
              aria-hidden
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="grid h-14 w-14 place-items-center rounded-full bg-gradient-hero text-primary-foreground shadow-elevated"
              tabIndex={-1}
              aria-hidden
            >
              <Play className="h-5 w-5 fill-current" />
            </button>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-primary"
              tabIndex={-1}
              aria-hidden
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Transcript
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              "Let's sync on the Q3 roadmap — I'll own the API migration, and we should send the
              recap to the team by Friday..."
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full font-normal">Email draft</Badge>
            <Badge variant="secondary" className="rounded-full font-normal">
              Task list
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
