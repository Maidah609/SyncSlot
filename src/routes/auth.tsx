import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — SyncSlot" },
      { name: "description", content: "Sign in or create your SyncSlot account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const nextPath = (): string => {
    if (typeof window === "undefined") return "/dashboard";
    const saved = window.sessionStorage.getItem("post_login_redirect");
    if (saved && saved.startsWith("/")) {
      window.sessionStorage.removeItem("post_login_redirect");
      return saved;
    }
    return "/dashboard";
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: nextPath() });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin + nextPath(),
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
        navigate({ to: nextPath() });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: nextPath() });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) { toast.error(result.error.message); setLoading(false); return; }
    if (!result.redirected) navigate({ to: nextPath() });
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full">
          <div className="mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">{mode === "signup" ? "Create your account" : "Welcome back"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" required value={name} onChange={e => setName(e.target.value)} /></div>
                )}
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "signin" && <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>}
                  </div>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}</Button>
              </form>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <Button type="button" onClick={google} variant="outline" className="w-full" disabled={loading}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Continue with Google
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already have an account? " : "New to SyncSlot? "}
                <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary hover:underline">
                  {mode === "signup" ? "Sign in" : "Create an account"}
                </button>
              </p>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
