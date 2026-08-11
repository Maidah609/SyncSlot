import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — SyncSlot" }, { name: "robots", content: "noindex" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader><CardTitle className="font-display text-2xl">Reset your password</CardTitle></CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">If an account exists for {email}, we sent a reset link.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "Send reset link"}</Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm"><Link to="/auth" className="text-primary hover:underline">Back to sign in</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
