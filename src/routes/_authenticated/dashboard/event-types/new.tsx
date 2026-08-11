import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/_authenticated/dashboard/event-types/new")({
  component: NewEventType,
});

const COMMON_TZS = [
  "UTC",
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Toronto", "America/Sao_Paulo",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Madrid", "Europe/Istanbul",
  "Africa/Cairo", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Sydney", "Pacific/Auckland",
];

function NewEventType() {
  const { userId } = Route.useRouteContext();
  const nav = useNavigate();
  const userTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<"GOOGLE_MEET" | "ZOOM" | "PHONE" | "IN_PERSON" | "CUSTOM">("GOOGLE_MEET");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timezone, setTimezone] = useState<string>(userTz);
  const [loading, setLoading] = useState(false);

  const tzOptions = useMemo(() => {
    const set = new Set<string>([userTz, ...COMMON_TZS]);
    return Array.from(set);
  }, [userTz]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const slug = slugify(title);
    const { data, error } = await supabase.from("event_types").insert({
      user_id: userId, title, slug, description, duration_minutes: duration,
      location_type: location,
      event_date: date ? format(date, "yyyy-MM-dd") : null,
      event_timezone: timezone,
    } as any).select().single();
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Event type created");
    nav({ to: "/dashboard/event-types/$id", params: { id: data.id } });
  };

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <h1 className="font-display text-4xl">New event type</h1>
      <Card className="mt-8">
        <CardHeader><CardTitle className="font-display text-2xl">The basics</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="30-min consultation" /></div>
            <div className="space-y-2"><Label>Duration (minutes)</Label>
              <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[15, 30, 45, 60, 90, 120].map(m => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Shown in {timezone}</p>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {tzOptions.map(tz => (
                      <SelectItem key={tz} value={tz}>
                        {tz}{tz === userTz ? " (yours)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2"><Label>Location</Label>
              <Select value={location} onValueChange={v => setLocation(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                  <SelectItem value="ZOOM">Zoom</SelectItem>
                  <SelectItem value="PHONE">Phone call</SelectItem>
                  <SelectItem value="IN_PERSON">In person</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this meeting about?" /></div>
            <Button type="submit" disabled={loading || !title}>{loading ? "..." : "Create"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
