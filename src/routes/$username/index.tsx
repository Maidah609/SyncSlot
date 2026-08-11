import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight } from "lucide-react";

const PROFILE_COLS = "id,name,username,timezone,avatar_url,brand_color,welcome_message,plan,onboarded,created_at,updated_at";

export const Route = createFileRoute("/$username/")({
  loader: async ({ params }) => {
    const { data: profile } = await supabase.from("profiles").select(PROFILE_COLS).eq("username", params.username).maybeSingle();
    if (!profile) throw notFound();
    const { data: events } = await supabase.from("event_types").select("*").eq("user_id", profile.id).eq("is_active", true).order("created_at");
    return { profile, events: events ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.profile.name || loaderData.profile.username} — SyncSlot` },
      { name: "description", content: loaderData.profile.welcome_message || `Book a meeting with ${loaderData.profile.name || loaderData.profile.username}.` },
      { property: "og:title", content: `Book a meeting with ${loaderData.profile.name || loaderData.profile.username}` },
      { property: "og:description", content: loaderData.profile.welcome_message || "Pick a time that works for you." },
    ] : [{ title: "Not found" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <div className="p-20 text-center"><h1 className="font-display text-5xl">User not found</h1><p className="mt-2 text-muted-foreground">This booking page doesn't exist.</p><Link to="/" className="mt-6 inline-block text-primary hover:underline">Back home</Link></div>,
  component: BookingProfile,
});

function BookingProfile() {
  const { profile, events } = Route.useLoaderData();
  const color = profile.brand_color || "#6E9695";
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-center">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name ?? profile.username ?? ""} className="mx-auto h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full font-display text-3xl text-white" style={{ background: color }}>
              {(profile.name || profile.username || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1 className="mt-6 font-display text-4xl">{profile.name || profile.username}</h1>
          {profile.welcome_message && <p className="mt-3 text-muted-foreground">{profile.welcome_message}</p>}
        </div>

        <div className="mt-10 space-y-3">
          {events.length === 0 && (
            <p className="text-center text-muted-foreground">No event types available yet.</p>
          )}
          {events.map((e: any) => (
            <Link key={e.id} to="/$username/$slug" params={{ username: profile.username!, slug: e.slug }}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full" style={{ background: e.color || color }} />
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {e.duration_minutes} min</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-muted-foreground">
          Powered by <Link to="/" className="hover:text-foreground">SyncSlot</Link>
        </p>
      </div>
    </div>
  );
}
