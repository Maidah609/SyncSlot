import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [timezone, setTimezone] = useState<string>(typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { nav({ to: "/auth" }); return; }
      setUserId(data.user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p?.onboarded && p.username) { nav({ to: "/dashboard" }); return; }
      if (p) {
        setName(p.name || "");
        setUsername(p.username || slugify(p.name || (data.user.email ?? "you").split("@")[0]));
        setTimezone(p.timezone || timezone);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!userId) return;
    setLoading(true);
    const clean = slugify(username);
    const { error } = await supabase.from("profiles").update({
      name, username: clean, timezone, onboarded: true,
    }).eq("id", userId);
    if (error) { setLoading(false); return toast.error(error.message.includes("unique") ? "That username is taken" : error.message); }
    // seed default event type + schedule
    const { data: existing } = await supabase.from("event_types").select("id").eq("user_id", userId).limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("event_types").insert({ user_id: userId, title: "30 Minute Meeting", slug: "30min", duration_minutes: 30 });
    }
    const { data: sched } = await supabase.from("schedules").select("id").eq("user_id", userId).eq("is_default", true).maybeSingle();
    if (!sched) {
      const { data: ns } = await supabase.from("schedules").insert({ user_id: userId, name: "Working hours", is_default: true, timezone }).select().single();
      await supabase.from("schedule_rules").insert((["MON","TUE","WED","THU","FRI"] as const).map(d => ({ schedule_id: ns!.id, day: d, start_minute: 540, end_minute: 1020 })));
    }
    setLoading(false);
    toast.success("Welcome to SyncSlot!");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <Card className="w-full">
        <CardHeader><CardTitle className="font-display text-3xl">Let's set you up.</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Your name</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Pick a username</Label>
              <div className="flex items-center gap-1"><span className="text-sm text-muted-foreground">syncslot.app/</span><Input required value={username} onChange={e => setUsername(e.target.value.toLowerCase())} /></div>
            </div>
            <div className="space-y-2"><Label>Timezone</Label><Input value={timezone} onChange={e => setTimezone(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "Finish setup"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
