import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — SyncSlot" },
      { name: "description", content: "SyncSlot is scheduling for people who care about their time." },
      { property: "og:title", content: "About — SyncSlot" },
      { property: "og:description", content: "The story behind SyncSlot." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="font-display text-5xl md:text-6xl">Scheduling, for humans.</h1>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>SyncSlot exists because scheduling meetings is one of the most annoying things you'll do this week — and it doesn't need to be.</p>
          <p>We built the tool we wanted for ourselves: a link that respects your time, your calendar, and your invitees. No cluttered UI. No pushy branding. Just fewer emails and more time back in your day.</p>
          <p>Whether you're a solo consultant, a founder taking sales calls, or a designer running client intros, SyncSlot gets out of your way and gets the meeting on the calendar.</p>
        </div>
      </section>
    </MarketingLayout>
  );
}
