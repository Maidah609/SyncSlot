import type React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe2, CalendarCheck2, Bell, Layers, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function MiniClock({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={"text-primary " + className} style={style} aria-hidden>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = 100 + Math.sin(a) * 86;
        const y1 = 100 - Math.cos(a) * 86;
        const x2 = 100 + Math.sin(a) * (i % 3 === 0 ? 74 : 80);
        const y2 = 100 - Math.cos(a) * (i % 3 === 0 ? 74 : 80);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />;
      })}
      <g className="animate-spin-slow" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <rect x="98" y="52" width="4" height="48" rx="2" fill="currentColor" />
      </g>
      <rect x="98.5" y="30" width="3" height="70" rx="1.5" fill="currentColor" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
    </svg>
  );
}

type GfxProps = { className?: string; style?: React.CSSProperties };

function GfxCalendar({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <rect x="10" y="18" width="80" height="70" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="10" y1="36" x2="90" y2="36" stroke="currentColor" strokeWidth="4" />
      <line x1="30" y1="10" x2="30" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="70" y1="10" x2="70" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="42" y="50" width="16" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}
function GfxCheck({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M32 52 L45 65 L70 38" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GfxBell({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <path d="M50 15 C34 15 26 27 26 42 v14 l-8 10 h64 l-8-10 V42 C74 27 66 15 50 15z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <path d="M42 74 a8 8 0 0 0 16 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function GfxVideo({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <rect x="12" y="28" width="56" height="44" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M68 44 L90 32 V68 L68 56 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
function GfxUser({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="42" r="12" fill="currentColor" />
      <path d="M28 78 c4-14 40-14 44 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
function GfxLink({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <path d="M40 60 l20-20" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M35 42 a14 14 0 0 0 0 20 l8 8 a14 14 0 0 0 20-20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M65 58 a14 14 0 0 0 0-20 l-8-8 a14 14 0 0 0-20 20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
function GfxMail({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <rect x="12" y="24" width="76" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M14 28 L50 56 L86 28" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
function GfxGlobe({ className = "", style }: GfxProps) {
  return (
    <svg viewBox="0 0 100 100" className={"text-primary " + className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
      <ellipse cx="50" cy="50" rx="18" ry="40" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function LandingPage() {
  return (
    <MarketingLayout>
      {/* Page-wide drifting background graphics */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Hero band (0-25%) */}
        <GfxCalendar className="animate-drift-lr absolute top-[3%] left-0 h-20 w-20" />
        <GfxCheck className="animate-linger absolute top-[6%] right-[12%] h-14 w-14" style={{ animationDelay: "-3s" }} />
        <GfxBell className="animate-drift-rl absolute top-[10%] right-0 h-20 w-20" style={{ animationDelay: "-6s" }} />
        <GfxMail className="animate-linger absolute top-[14%] left-[18%] h-16 w-16" style={{ animationDelay: "-8s" }} />
        <GfxGlobe className="animate-drift-td absolute top-[2%] left-[54%] h-16 w-16" style={{ animationDelay: "-11s" }} />
        <GfxLink className="animate-linger absolute top-[20%] right-[32%] h-14 w-14" style={{ animationDelay: "-2s" }} />

        {/* Features band (25-45%) */}
        <GfxUser className="animate-linger absolute top-[26%] left-[4%] h-16 w-16" style={{ animationDelay: "-9s" }} />
        <GfxVideo className="animate-drift-td absolute top-[30%] left-[70%] h-20 w-20" style={{ animationDelay: "-10s" }} />
        <GfxCalendar className="animate-drift-rl absolute top-[34%] right-0 h-16 w-16" style={{ animationDelay: "-13s" }} />
        <GfxMail className="animate-linger absolute top-[38%] left-[38%] h-14 w-14" style={{ animationDelay: "-5s" }} />
        <GfxCheck className="animate-drift-lr absolute top-[42%] left-0 h-16 w-16" style={{ animationDelay: "-1s" }} />

        {/* How it works band (45-65%) */}
        <GfxLink className="animate-drift-lr absolute top-[48%] left-0 h-16 w-16" style={{ animationDelay: "-14s" }} />
        <GfxGlobe className="animate-linger absolute top-[52%] right-[8%] h-20 w-20" style={{ animationDelay: "-5s" }} />
        <GfxBell className="animate-drift-td absolute top-[50%] left-[46%] h-14 w-14" style={{ animationDelay: "-7s" }} />
        <GfxUser className="animate-linger absolute top-[58%] right-[38%] h-16 w-16" style={{ animationDelay: "-12s" }} />
        <GfxCalendar className="animate-drift-rl absolute top-[62%] right-0 h-16 w-16" style={{ animationDelay: "-4s" }} />
        <GfxVideo className="animate-linger absolute top-[60%] left-[14%] h-14 w-14" style={{ animationDelay: "-6s" }} />

        {/* Testimonials band (65-80%) */}
        <GfxMail className="animate-drift-rl absolute top-[68%] right-0 h-20 w-20" style={{ animationDelay: "-12s" }} />
        <GfxCheck className="animate-linger absolute top-[72%] left-[8%] h-16 w-16" style={{ animationDelay: "-2s" }} />
        <GfxLink className="animate-drift-td absolute top-[70%] left-[58%] h-14 w-14" style={{ animationDelay: "-9s" }} />
        <GfxGlobe className="animate-linger absolute top-[76%] right-[24%] h-14 w-14" style={{ animationDelay: "-3s" }} />
        <GfxBell className="animate-drift-lr absolute top-[78%] left-0 h-16 w-16" style={{ animationDelay: "-11s" }} />

        {/* Pricing band (80-100%) */}
        <GfxCalendar className="animate-linger absolute top-[82%] left-[12%] h-16 w-16" style={{ animationDelay: "-2s" }} />
        <GfxVideo className="animate-drift-td absolute top-[84%] left-[62%] h-16 w-16" style={{ animationDelay: "-7s" }} />
        <GfxUser className="animate-linger absolute top-[88%] right-[10%] h-16 w-16" style={{ animationDelay: "-11s" }} />
        <GfxMail className="animate-drift-lr absolute top-[92%] left-0 h-16 w-16" style={{ animationDelay: "-4s" }} />
        <GfxCheck className="animate-drift-rl absolute top-[94%] right-0 h-14 w-14" style={{ animationDelay: "-8s" }} />
        <GfxLink className="animate-linger absolute top-[96%] left-[42%] h-14 w-14" style={{ animationDelay: "-6s" }} />
      </div>


      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Scheduling, quietly done
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
              The calmest way to get on someone&apos;s calendar.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              SyncSlot gives busy professionals a single, elegant link. Share your availability,
              let invitees pick a time, and skip the email back-and-forth entirely.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Button asChild size="lg" className="rounded-md px-6">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Link to="/features" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
                See a live booking page
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card required · 14-day trial of Pro
            </p>
          </div>

          {/* Booking preview */}
          <div className="relative">
            {/* Animated clock behind the calendar */}
            <div
              aria-hidden
              className="animate-clock-slide pointer-events-none absolute inset-0 z-20 grid place-items-center"
            >
              <svg viewBox="0 0 200 200" className="h-[78%] w-[78%] max-w-none text-primary">
                <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = (i * Math.PI) / 6;
                  const x1 = 100 + Math.sin(a) * 86;
                  const y1 = 100 - Math.cos(a) * 86;
                  const x2 = 100 + Math.sin(a) * (i % 3 === 0 ? 74 : 80);
                  const y2 = 100 - Math.cos(a) * (i % 3 === 0 ? 74 : 80);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />;
                })}
                <g className="animate-hand-hour" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
                  <rect x="98" y="52" width="4" height="48" rx="2" fill="currentColor" />
                </g>
                <g className="animate-hand-minute" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
                  <rect x="98.5" y="30" width="3" height="70" rx="1.5" fill="currentColor" />
                </g>
                <circle cx="100" cy="100" r="4" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Sarah Chen
                  </p>
                  <h3 className="mt-2 font-display text-2xl">Career Strategy Session</h3>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  30 min
                </span>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Thursday, June 12</p>
                  <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-xs text-muted-foreground">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(n => (
                      <span
                        key={n}
                        className={
                          n === 12
                            ? "mx-auto grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
                            : "text-foreground/70"
                        }
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Available times</p>
                  <ul className="mt-3 space-y-2">
                    {["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM"].map((t, i) => (
                      <li
                        key={t}
                        className={
                          i === 2
                            ? "rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm"
                            : "rounded-md border border-border px-3 py-2 text-sm"
                        }
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden border-b border-border/60">
        {/* Animated backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="animate-blob absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="animate-blob-slow absolute top-20 right-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="animate-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Features</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            SyncSlot is built for people who want scheduling to feel considered — not gamified.
          </p>
          <div className="mt-14 grid gap-10 md:grid-cols-4">
            {[
              { Icon: Globe2, title: "Timezone-aware scheduling", body: "Invitees always see times in their local timezone. No mental math, no misfires." },
              { Icon: CalendarCheck2, title: "Calendar conflict detection", body: "SyncSlot checks your connected calendars in real time so you're never double-booked." },
              { Icon: Bell, title: "Booking reminders", body: "Gentle email reminders that reduce no-shows without feeling pushy." },
              { Icon: Layers, title: "Custom event types", body: "Different durations, questions, and policies for intro calls, deep-dives, and everything between." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="group">
                <span className="relative grid h-11 w-11 place-items-center rounded-lg bg-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                  <span aria-hidden className="animate-pulse-ring absolute inset-0 rounded-lg bg-primary/25" />
                  <Icon className="relative h-4 w-4 text-primary" />
                </span>
                <h3 className="mt-6 font-display text-xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="animate-blob-slow absolute top-10 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="animate-blob absolute bottom-0 -left-10 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">
            Four small steps. Then it just runs.
          </h2>
          <div className="mt-14 grid gap-10 border-t border-border/60 pt-10 md:grid-cols-4">
            {[
              { n: "01", title: "Create an event type", body: "Choose a duration, add a description, and set your rules." },
              { n: "02", title: "Set your availability", body: "Define weekly hours or per-day windows. Add overrides for one-off changes." },
              { n: "03", title: "Share your link", body: "One elegant URL for every meeting, or one per event type." },
              { n: "04", title: "Get booked", body: "Invitees pick a time. Everyone gets a calendar invite. Done." },
            ].map(step => (
              <div key={step.n} className="group relative">
                <div className="relative inline-block">
                  <svg
                    aria-hidden
                    viewBox="0 0 64 64"
                    className="animate-orbit absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-primary/50"
                  >
                    <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
                    <circle cx="32" cy="2" r="2.2" fill="currentColor" />
                  </svg>
                  <p className="relative font-display text-3xl text-primary/70">{step.n}</p>
                </div>
                <h3 className="mt-6 font-display text-xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border/60 bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-24 md:grid-cols-2">
          {[
            {
              quote: "SyncSlot replaced three tools we were duct-taping together. It's the first scheduling product my clients have complimented.",
              name: "Priya Natarajan",
              role: "Founder, Northwind Advisory",
            },
            {
              quote: "It feels considered — like every screen was actually thought through. Rare in this category.",
              name: "Daniel Osei",
              role: "Product Designer, Fig Studio",
            },
          ].map(t => (
            <figure
              key={t.name}
              className="bg-quote-gradient relative overflow-hidden rounded-2xl border border-primary/20 p-8 shadow-sm"
            >
              <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
              <span aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
              <svg aria-hidden viewBox="0 0 32 32" className="relative h-8 w-8 text-primary/70">
                <path fill="currentColor" d="M10 8C6 8 3 11 3 15v9h9v-9H7c0-2 1-3 3-3V8zm14 0c-4 0-7 3-7 7v9h9v-9h-5c0-2 1-3 3-3V8z" />
              </svg>
              <blockquote className="relative mt-4 font-display text-2xl leading-snug text-foreground">
                {t.quote}
              </blockquote>
              <figcaption className="relative mt-6 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t.name}</span> · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>


      {/* Pricing */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Pricing</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl md:text-5xl">
            Simple pricing. Per user, per month.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                body: "One event type, unlimited bookings, one connected calendar.",
                cta: "Get started",
                to: "/auth" as const,
                variant: "outline" as const,
              },
              {
                name: "Pro",
                price: "$12",
                body: "Unlimited event types, multiple calendars, custom branding, reminders.",
                cta: "Start Pro trial",
                to: "/auth" as const,
                variant: "default" as const,
                highlight: true,
              },
              {
                name: "Team",
                price: "$20",
                body: "Everything in Pro, plus shared availability, roles, and team billing.",
                cta: "Contact sales",
                to: "/contact" as const,
                variant: "outline" as const,
              },
            ].map(p => (
              <div
                key={p.name}
                className={
                  "flex flex-col rounded-2xl border p-8 " +
                  (p.highlight ? "border-primary/40 bg-card shadow-sm" : "border-primary/20 bg-quote-gradient")
                }
              >
                <p className="text-sm font-medium text-muted-foreground">{p.name}</p>
                <p className="mt-4 font-display text-5xl">
                  {p.price}
                  <span className="ml-1 align-top text-sm text-muted-foreground">/mo</span>
                </p>
                <p className="mt-4 text-sm text-muted-foreground">{p.body}</p>
                <Button asChild variant={p.variant} className="mt-8">
                  <Link to={p.to}>{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            {["Cancel anytime", "Data export included", "GDPR-ready", "Google Calendar sync"].map(x => (
              <li key={x} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingLayout>
  );
}
