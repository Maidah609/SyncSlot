import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";
import { CalendarClock, Zap, Globe2, ShieldCheck, Sparkles, Users, Bell, Link2, Palette } from "lucide-react";
import featureEventTypes from "@/assets/feature-event-types.jpg";
import featureTimezone from "@/assets/feature-timezone.jpg";
import featureSync from "@/assets/feature-sync.jpg";
import featureBuffers from "@/assets/feature-buffers.jpg";
import featureQuestions from "@/assets/feature-questions.jpg";
import featureEmail from "@/assets/feature-email.jpg";
import featureLink from "@/assets/feature-link.jpg";
import featureBranding from "@/assets/feature-branding.jpg";
import featureBeautiful from "@/assets/feature-beautiful.jpg";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — SyncSlot" },
      { name: "description", content: "Event types, availability schedules, Google Calendar sync, custom questions, and beautiful booking pages." },
      { property: "og:title", content: "Features — SyncSlot" },
      { property: "og:description", content: "Everything SyncSlot does — the short version." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { Icon: CalendarClock, image: featureEventTypes, title: "Multiple event types", body: "15-minute intros, hour-long consultations, 90-minute workshops — each with its own duration, questions, and availability." },
  { Icon: Globe2, image: featureTimezone, title: "Time-zone aware", body: "Invitees pick from times in their local zone. You always see them in yours. No mental math." },
  { Icon: Zap, image: featureSync, title: "Google Calendar sync", body: "Two-way sync hides existing conflicts and pushes new bookings onto your calendar automatically." },
  { Icon: ShieldCheck, image: featureBuffers, title: "Buffers & daily limits", body: "Add breathing room before and after meetings. Cap total bookings per day to protect focus time." },
  { Icon: Users, image: featureQuestions, title: "Custom questions", body: "Ask what you need — free-form, multiple choice, or yes/no. Required or optional." },
  { Icon: Bell, image: featureEmail, title: "Email confirmations", body: "Invitees and hosts both get clean confirmation emails with reschedule and cancel links." },
  { Icon: Link2, image: featureLink, title: "One shareable link", body: "syncslot.app/yourname is a landing page for every meeting type you offer." },
  { Icon: Palette, image: featureBranding, title: "Personal branding", body: "Choose a brand color, add a welcome message, and pick a friendly username." },
  { Icon: Sparkles, image: featureBeautiful, title: "Beautiful by default", body: "A booking flow that doesn't feel like a spreadsheet from 2011." },
];

function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        {/* Animated backdrop blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-blob absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="animate-blob-slow absolute top-40 -right-20 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
          <div className="animate-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl text-center animate-fade-in">
          <h1 className="font-display text-5xl md:text-6xl">Everything SyncSlot does.</h1>
          <p className="mt-4 text-lg text-muted-foreground">A focused set of features designed to get you booked with minimum friction.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map(({ Icon, image, title, body }, i) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl animate-blur-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-muted">
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  width={768}
                  height={512}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
              <div className="relative p-6">
                <div className="relative inline-grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <span className="animate-pulse-ring absolute inset-0 rounded-xl bg-primary/20" />
                  <Icon className="relative h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

