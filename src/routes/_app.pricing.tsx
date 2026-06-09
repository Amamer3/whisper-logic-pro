import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pricing")({
  head: () => ({ meta: [{ title: "Plans — VoiceFlow" }] }),
  component: PricingPage,
});

interface Plan {
  id: string; name: string; price: string; period: string; desc: string;
  features: string[]; cta: string; highlighted?: boolean;
}
const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try VoiceFlow with everything you need to get started.",
    features: ["10 recordings / month", "20 AI generations / month", "Standard voices", "30 day history"],
    cta: "Current plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "/ month",
    desc: "Unlimited capture and generation for individuals.",
    features: ["Unlimited recordings", "Unlimited AI generations", "Premium voices", "Unlimited history", "Custom templates"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    period: "/ seat / month",
    desc: "Shared workspace, recordings, and templates for your team.",
    features: ["Everything in Pro", "Shared workspace", "Shared recordings & prompts", "Team analytics", "Priority support"],
    cta: "Contact sales",
  },
];

function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Plans & pricing</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Simple plans that scale with how much you ship.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <Card
            key={p.id}
            className={`flex flex-col p-6 ${p.highlighted ? "border-primary shadow-elevated ring-1 ring-primary/30" : ""}`}
          >
            <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{p.name}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.period}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            <ul className="my-6 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-auto"
              variant={p.highlighted ? "default" : "outline"}
              disabled={p.id === "free"}
              onClick={() => toast.info("Payments are coming next — wire Stripe to activate this.")}
            >
              {p.cta}
            </Button>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Need higher limits or enterprise terms? Email{" "}
        <a className="text-primary hover:underline" href="mailto:hello@voiceflow.app">hello@voiceflow.app</a>.
      </p>
    </div>
  );
}
