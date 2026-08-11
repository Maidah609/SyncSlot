import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import { AlertTriangle, Check, Pencil, Trash2, UserPlus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  component: SettingsPage,
});

type Tab = "profile" | "account" | "billing" | "team";

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
    { id: "billing", label: "Billing" },
    { id: "team", label: "Team" },
  ];

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <div>
        <h1 className="font-display text-5xl">Settings</h1>
        <p className="mt-2 text-muted-foreground">Your public profile and account preferences.</p>
      </div>

      <div className="mt-10 border-b border-border">
        <div className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-sm transition-colors ${
                tab === t.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.id && <span className="absolute -bottom-px left-0 h-0.5 w-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {tab === "profile" && <ProfileTab />}
        {tab === "account" && <AccountTab />}
        {tab === "billing" && <BillingTab />}
        {tab === "team" && <TeamTab />}
      </div>
    </div>
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

function EditableRow({
  label,
  value,
  editing,
  onEdit,
  onCancel,
  placeholder,
  prefix,
  multiline,
  onChange,
  displayValue,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  placeholder?: string;
  prefix?: string;
  multiline?: boolean;
  onChange: (v: string) => void;
  displayValue?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {editing ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
      </div>
      {editing ? (
        prefix ? (
          <div className="flex items-stretch overflow-hidden rounded-md border border-input">
            <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">{prefix}</span>
            <input
              autoFocus
              className="flex-1 bg-background px-3 py-2 text-sm outline-none"
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(e.target.value.toLowerCase())}
            />
          </div>
        ) : multiline ? (
          <Textarea autoFocus rows={4} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <Input autoFocus value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm min-h-[40px] whitespace-pre-wrap">
          {displayValue ?? value ?? <span className="text-muted-foreground">{placeholder ?? "Not set"}</span>}
          {!(displayValue ?? value) && !placeholder && <span className="text-muted-foreground">Not set</span>}
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const { userId } = Route.useRouteContext();
  const [p, setP] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [headline, setHeadline] = useState("");
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle().then(({ data }) => {
      setP(data);
    });
    if (typeof window !== "undefined") {
      setHeadline(localStorage.getItem("headline") ?? "");
      setTimeFormat((localStorage.getItem("time_format") as "12" | "24") ?? "12");
    }
  }, [userId]);

  if (!p) return <div className="text-muted-foreground">Loading...</div>;
  const upd = (k: string, v: any) => setP({ ...p, [k]: v });
  const toggle = (k: string, on: boolean) => setEditing((e) => ({ ...e, [k]: on }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: p.name,
      username: p.username ? slugify(p.username) : null,
      timezone: p.timezone,
      welcome_message: p.welcome_message,
      avatar_url: p.avatar_url,
    }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message.includes("unique") ? "That username is taken" : error.message);
    localStorage.setItem("headline", headline);
    localStorage.setItem("time_format", timeFormat);
    setEditing({});
    toast.success("Settings saved");
  };

  const timezones = typeof Intl !== "undefined" && (Intl as any).supportedValuesOf
    ? (Intl as any).supportedValuesOf("timeZone") as string[]
    : ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London"];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Public profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">What people see on your booking page.</p>

          <div className="mt-6 flex items-center gap-5 border-b border-border pb-6">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 font-medium text-primary">
                {initials(p.name)}
              </div>
            )}
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => upd("avatar_url", reader.result as string);
                    reader.readAsDataURL(f);
                  }}
                />
                <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">Upload photo</span>
              </label>
              <Button variant="ghost" size="icon" aria-label="Delete photo" title="Delete photo" onClick={() => upd("avatar_url", null)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <EditableRow
              label="Full name"
              value={p.name ?? ""}
              editing={!!editing.name}
              onEdit={() => toggle("name", true)}
              onCancel={() => toggle("name", false)}
              onChange={(v) => upd("name", v)}
              placeholder="Your name"
            />
            <EditableRow
              label="Username"
              value={p.username ?? ""}
              editing={!!editing.username}
              onEdit={() => toggle("username", true)}
              onCancel={() => toggle("username", false)}
              onChange={(v) => upd("username", v)}
              prefix="syncslot.app/"
              placeholder="your-name"
              displayValue={p.username ? `syncslot.app/${p.username}` : ""}
            />
            <EditableRow
              label="Headline"
              value={headline}
              editing={!!editing.headline}
              onEdit={() => toggle("headline", true)}
              onCancel={() => toggle("headline", false)}
              onChange={setHeadline}
              placeholder="Career Coach · Ex-Google PM"
            />
            <EditableRow
              label="Welcome message"
              value={p.welcome_message ?? ""}
              editing={!!editing.welcome_message}
              onEdit={() => toggle("welcome_message", true)}
              onCancel={() => toggle("welcome_message", false)}
              onChange={(v) => upd("welcome_message", v)}
              multiline
              placeholder="A warm hello for people booking time with you."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Preferences</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={p.timezone ?? "UTC"} onValueChange={(v) => upd("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time format</Label>
              <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as "12" | "24")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </div>

      <aside className="rounded-2xl border border-border bg-card p-6 h-fit">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Preview</p>
        <div className="mt-6 rounded-xl border border-border p-6 text-center">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 font-medium text-primary">
              {initials(p.name)}
            </div>
          )}
          <h3 className="mt-4 font-display text-2xl">{p.name || "Your name"}</h3>
          {headline && <p className="mt-1 text-sm text-muted-foreground">{headline}</p>}
          {p.welcome_message && <p className="mt-4 text-sm text-muted-foreground">{p.welcome_message}</p>}
        </div>
      </aside>
    </div>
  );
}

function AccountTab() {
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [notif, setNotif] = useState({ booking: true, digest: true, product: false });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const updateEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return toast.error(error.message);
    toast.success("Check your inbox to confirm the new email");
  };

  const changePw = async () => {
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPw !== confirmPw) return toast.error("Passwords don't match");
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) return toast.error(error.message);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    toast.success("Password updated");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Email address</h2>
        <p className="mt-1 text-sm text-muted-foreground">Used for sign-in and booking notifications.</p>
        <div className="mt-6 space-y-2">
          <Label>Email</Label>
          <div className="flex gap-3">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
            <Button onClick={updateEmail}>Update email</Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">At least 8 characters.</p>
        <div className="mt-6 space-y-4">
          <div className="space-y-2"><Label>Current password</Label><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          <div className="flex justify-end"><Button variant="outline" onClick={changePw}>Change password</Button></div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose what SyncSlot emails you about.</p>
        <div className="mt-6 divide-y divide-border">
          {[
            { key: "booking", title: "New booking alerts", desc: "Get an email each time someone books a time." },
            { key: "digest", title: "Weekly digest", desc: "A calm Monday summary of the week ahead." },
            { key: "product", title: "Product updates", desc: "Occasional notes on what we've shipped." },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-sm text-muted-foreground">{row.desc}</p>
              </div>
              <Switch
                checked={(notif as any)[row.key]}
                onCheckedChange={(v) => setNotif({ ...notif, [row.key]: v })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1">
            <h2 className="font-display text-xl">Delete account</h2>
            <p className="mt-1 text-sm text-muted-foreground">This permanently removes your account, event types, and history. There is no undo.</p>
            <div className="mt-4"><Button variant="destructive" onClick={() => toast.error("Contact support to delete your account.")}>Delete my account</Button></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BillingTab() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const plans = [
    { id: "free", name: "Free", price: "$0", tag: "For solo work.", features: ["1 event type", "1 calendar", "SyncSlot branding"], cta: "Switch to Free" },
    { id: "pro", name: "Pro", price: "$12", tag: "For freelancers.", features: ["Unlimited event types", "Multiple calendars", "Custom branding", "Reminders"], cta: "Current plan", current: true },
    { id: "team", name: "Team", price: "$20", tag: "For teams.", features: ["Everything in Pro", "Shared availability", "Round-robin", "Team billing"], cta: "Contact sales" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg">Current plan</p>
            <p className="mt-2 font-display text-3xl">Pro</p>
            <p className="mt-1 text-sm text-muted-foreground">Change or upgrade your plan anytime.</p>
          </div>
          <div className="inline-flex rounded-full border border-border p-1 text-sm">
            <button onClick={() => setInterval("monthly")} className={`rounded-full px-4 py-1.5 ${interval === "monthly" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>Monthly</button>
            <button onClick={() => setInterval("yearly")} className={`rounded-full px-4 py-1.5 ${interval === "yearly" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>Yearly · Save 20%</button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <p className="text-lg font-medium">{p.name}</p>
              {p.current && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs uppercase tracking-wider text-primary">Current</span>}
            </div>
            <p className="mt-3 font-display text-4xl">{p.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="mt-1 text-sm text-muted-foreground">{p.tag}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>)}
            </ul>
            <Button className="mt-6" variant={p.current ? "outline" : "default"} disabled={p.current}>{p.cta}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamTab() {
  const { userId } = Route.useRouteContext();
  const [members, setMembers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [{ data: m }, { data: inv }] = await Promise.all([
      supabase.from("team_members").select("*").eq("owner_id", userId).order("created_at"),
      supabase.from("team_invites").select("*").eq("inviter_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setMembers(m ?? []);
    setPending(inv ?? []);
  };

  useEffect(() => { load(); }, [userId]);

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) return toast.error("Enter a valid email");
    setSending(true);
    const { data, error } = await supabase.from("team_invites").insert({
      inviter_id: userId, email, role: "Member",
    }).select().single();
    setSending(false);
    if (error) {
      return toast.error(error.message.includes("duplicate") ? "You've already invited that email" : error.message);
    }
    const link = `${window.location.origin}/invite/${data.token}`;
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    toast.success("Invite created — link copied to clipboard", {
      description: "Share this link with them to join your team.",
    });
    setInviteEmail(""); setInviteOpen(false);
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("team_invites").update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Invite revoked");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Member removed");
    load();
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try { await navigator.clipboard.writeText(link); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl">Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">{members.length} {members.length === 1 ? "member" : "members"} on your team.</p>
          </div>
          <Button onClick={() => setInviteOpen(!inviteOpen)}><UserPlus className="mr-2 h-4 w-4" /> Invite member</Button>
        </div>

        {inviteOpen && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Input placeholder="teammate@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1 min-w-[220px]" />
            <Button onClick={invite} disabled={sending}>{sending ? "..." : "Send invite"}</Button>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
          </div>
        )}

        <div className="mt-6 divide-y divide-border">
          {members.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">No members yet. Invite someone to get started.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-sm font-medium text-primary">{initials(m.name || m.email)}</div>
                <div>
                  <p className="font-medium">{m.name || m.email}</p>
                  <p className="text-sm text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{m.role}</span>
                <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {pending.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Pending invites</h2>
          <p className="mt-1 text-sm text-muted-foreground">Share the invite link with each person — once they sign in and accept, they'll appear as a member.</p>
          <div className="mt-4 divide-y divide-border">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{p.email}</p>
                  <p className="text-sm text-muted-foreground">Invited {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {p.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyLink(p.token)}>Copy link</Button>
                  <Button variant="ghost" size="sm" onClick={() => revoke(p.id)}>Revoke</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

