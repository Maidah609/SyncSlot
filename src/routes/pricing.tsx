import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — SyncSlot" },
      { name: "description", content: "Simple, transparent pricing. Free forever for individuals, with a Pro plan when you need more." },
      { property: "og:title", content: "Pricing — SyncSlot" },
      { property: "og:description", content: "Free forever for individuals. Pro for power users." },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  { name: "Free", price: "$0", cadence: "forever", cta: "Get started", features: ["1 event type", "Unlimited bookings", "Google Calendar sync", "Email confirmations", "SyncSlot branding"] },
  { name: "Pro", price: "$12", cadence: "per user / month", cta: "Start Pro trial", highlight: true, features: ["Unlimited event types", "Custom questions", "Buffers & daily limits", "Remove SyncSlot branding", "Priority support"] },
  { name: "Team", price: "Contact us", cadence: "for pricing", cta: "Talk to sales", features: ["Everything in Pro", "Team scheduling", "Round-robin routing", "Admin controls", "SLA & onboarding"] },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl md:text-6xl">Simple pricing.</h1>
          <p className="mt-4 text-lg text-muted-foreground">Free forever for individuals. Pay only when you need more.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map(t => (
            <div key={t.name} className={`rounded-2xl border p-8 ${t.highlight ? "border-primary bg-card shadow-sm" : "border-primary/20 bg-quote-gradient"}`}>
              <h3 className="font-display text-2xl">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.cadence}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={t.highlight ? "default" : "outline"}>
                <Link to="/auth" search={{ mode: "signup" }}>{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
