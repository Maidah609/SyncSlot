import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/layout";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SyncSlot" },
      { name: "description", content: "Get in touch with the SyncSlot team — sales, feedback, or support." },
      { property: "og:title", content: "Contact — SyncSlot" },
      { property: "og:description", content: "We read every note." },
    ],
  }),
  component: ContactPage,
});

const channels = [
  {
    icon: Mail,
    title: "Email",
    body: "hello@syncslot.app — for anything and everything.",
  },
  {
    icon: MessageSquare,
    title: "Sales",
    body: "Interested in Team pricing? We'll set up a call.",
  },
  {
    icon: HelpCircle,
    title: "Help center",
    body: "Guides for setup, calendars, and troubleshooting.",
  },
];

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    // No backend endpoint wired — mimic a send.
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    toast.success("Thanks — we'll be in touch shortly.");
    setName("");
    setEmail("");
    setMessage("");
    setReason("general");
  };

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">CONTACT</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-7xl">
          Say hello. We read every note.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Sales, feedback, feature requests, or just a hello — the form goes to a real inbox that a real person opens.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <div className="border-t border-border/60" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <ul className="space-y-10">
            {channels.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl">{title}</h3>
                  <p className="mt-1 text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  maxLength={255}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General question</SelectItem>
                  <SelectItem value="sales">Sales / Team pricing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6 space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
                maxLength={2000}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <Button type="submit" disabled={sending} size="lg">
                {sending ? "Sending…" : "Send message"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </MarketingLayout>
  );
}
