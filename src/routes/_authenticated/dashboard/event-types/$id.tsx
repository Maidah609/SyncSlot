import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/event-types/$id")({
  component: EditEventType,
});

type QType = "TEXT" | "MULTI_CHOICE" | "YES_NO";
type Question = { id?: string; label: string; type: QType; required: boolean; options: string[]; position: number };

function EditEventType() {
  const { id } = Route.useParams();
  const { userId } = Route.useRouteContext();
  const nav = useNavigate();
  const [et, setEt] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("event_types").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
      setEt(data);
      const { data: q } = await supabase.from("booking_questions").select("*").eq("event_type_id", id).order("position");
      setQuestions((q ?? []).map((r: any) => ({
        id: r.id, label: r.label, type: r.type, required: r.required,
        options: Array.isArray(r.options) ? r.options : [], position: r.position,
      })));
    })();
  }, [id, userId]);

  if (!et) return <div className="p-10 text-muted-foreground">Loading...</div>;
  const upd = (k: string, v: any) => setEt({ ...et, [k]: v });

  const addQuestion = () => setQuestions([...questions, { label: "", type: "TEXT", required: false, options: [], position: questions.length }]);
  const updQuestion = (i: number, patch: Partial<Question>) => setQuestions(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from("event_types").update({
      title: et.title, slug: et.slug, description: et.description,
      duration_minutes: et.duration_minutes, location_type: et.location_type, location_value: et.location_value,
      color: et.color, buffer_before: et.buffer_before, buffer_after: et.buffer_after,
      min_notice_mins: et.min_notice_mins, max_future_days: et.max_future_days,
      daily_limit: et.daily_limit,
    }).eq("id", id);
    if (error) { setLoading(false); return toast.error(error.message); }

    await supabase.from("booking_questions").delete().eq("event_type_id", id);
    const toInsert = questions
      .filter(q => q.label.trim().length > 0)
      .map((q, idx) => ({
        event_type_id: id, label: q.label.trim(), type: q.type,
        required: q.required,
        options: q.type === "MULTI_CHOICE" ? q.options.map(o => o.trim()).filter(Boolean) : [],
        position: idx,
      }));
    if (toInsert.length) {
      const { error: qErr } = await supabase.from("booking_questions").insert(toInsert);
      if (qErr) { setLoading(false); return toast.error(qErr.message); }
    }
    setLoading(false);
    toast.success("Saved");
  };

  const remove = async () => {
    if (!confirm("Delete this event type?")) return;
    const { error } = await supabase.from("event_types").delete().eq("id", id);
    if (error) return toast.error(error.message);
    nav({ to: "/dashboard/event-types" });
  };

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Edit event type</h1>
        <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle className="font-display text-2xl">Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2"><Label>Title</Label><Input value={et.title} onChange={e => upd("title", e.target.value)} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={et.slug} onChange={e => upd("slug", e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={et.description ?? ""} onChange={e => upd("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Duration (min)</Label>
              <Select value={String(et.duration_minutes)} onValueChange={v => upd("duration_minutes", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[15, 30, 45, 60, 90, 120].map(m => <SelectItem key={m} value={String(m)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Color</Label><Input type="color" value={et.color ?? "#6E9695"} onChange={e => upd("color", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Location</Label>
            <Select value={et.location_type} onValueChange={v => upd("location_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                <SelectItem value="ZOOM">Zoom</SelectItem>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="IN_PERSON">In person</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {["ZOOM", "PHONE", "IN_PERSON", "CUSTOM"].includes(et.location_type) && (
            <div className="space-y-2"><Label>Location details</Label><Input value={et.location_value ?? ""} onChange={e => upd("location_value", e.target.value)} placeholder={et.location_type === "PHONE" ? "+1 555 ..." : "Address / meeting link / notes"} /></div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-display text-2xl">Limits</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Buffer before (min)</Label><Input type="number" min={0} value={et.buffer_before} onChange={e => upd("buffer_before", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Buffer after (min)</Label><Input type="number" min={0} value={et.buffer_after} onChange={e => upd("buffer_after", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Min notice (min)</Label><Input type="number" min={0} value={et.min_notice_mins} onChange={e => upd("min_notice_mins", Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Max future (days)</Label><Input type="number" min={1} value={et.max_future_days} onChange={e => upd("max_future_days", Number(e.target.value))} /></div>
          <div className="space-y-2 col-span-2"><Label>Daily bookings limit (blank = none)</Label><Input type="number" min={1} value={et.daily_limit ?? ""} onChange={e => upd("daily_limit", e.target.value === "" ? null : Number(e.target.value))} /></div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-2xl">Booking questions</CardTitle>
          <Button size="sm" variant="outline" onClick={addQuestion}><Plus className="mr-2 h-4 w-4" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 && <p className="text-sm text-muted-foreground">No custom questions. Invitees will only be asked for name and email.</p>}
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Input placeholder="Question label" value={q.label} onChange={e => updQuestion(i, { label: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeQuestion(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label className="text-xs">Type</Label>
                  <Select value={q.type} onValueChange={v => updQuestion(i, { type: v as QType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Short text</SelectItem>
                      <SelectItem value="MULTI_CHOICE">Multiple choice</SelectItem>
                      <SelectItem value="YES_NO">Yes / No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={q.required} onCheckedChange={v => updQuestion(i, { required: v })} />
                  <Label className="text-sm">Required</Label>
                </div>
              </div>
              {q.type === "MULTI_CHOICE" && (
                <div className="space-y-2">
                  <Label className="text-xs">Options (one per line)</Label>
                  <Textarea rows={3} value={q.options.join("\n")} onChange={e => updQuestion(i, { options: e.target.value.split("\n") })} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={loading}>{loading ? "..." : "Save changes"}</Button>
      </div>
    </div>
  );
}
