import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join a SyncSlot team" },
      { name: "description", content: "Accept your invite to join a SyncSlot team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "signin" | "ready" | "accepting" | "done" | "error">("checking");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("signin");
        return;
      }
      setStatus("ready");
    })();
  }, []);

  const accept = async () => {
    setStatus("accepting");
    const { error } = await supabase.rpc("accept_team_invite", { _token: token });
    if (error) {
      const msg = error.message.includes("invite_not_found")
        ? "This invite link is invalid."
        : error.message.includes("invite_accepted")
        ? "This invite has already been accepted."
        : error.message.includes("invite_revoked")
        ? "This invite has been revoked."
        : error.message;
      setError(msg);
      setStatus("error");
      return;
    }
    setStatus("done");
    toast.success("You've joined the team");
    setTimeout(() => navigate({ to: "/dashboard" }), 800);
  };

  const goSignIn = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("post_login_redirect", `/invite/${token}`);
    }
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
        <div className="w-full">
          <div className="mb-8 flex justify-center"><Logo size="md" to="" /></div>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Join a team on SyncSlot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === "checking" && <p className="text-sm text-muted-foreground">Checking your invite…</p>}
              {status === "signin" && (
                <>
                  <p className="text-sm text-muted-foreground">Sign in or create an account to accept this invitation.</p>
                  <Button className="w-full" onClick={goSignIn}>Sign in to accept</Button>
                </>
              )}
              {status === "ready" && (
                <>
                  <p className="text-sm text-muted-foreground">You've been invited to join a team. Click below to accept.</p>
                  <Button className="w-full" onClick={accept}>Accept invitation</Button>
                </>
              )}
              {status === "accepting" && <p className="text-sm text-muted-foreground">Accepting…</p>}
              {status === "done" && <p className="text-sm text-muted-foreground">You're in! Taking you to your dashboard…</p>}
              {status === "error" && (
                <>
                  <p className="text-sm text-destructive">{error}</p>
                  <Button asChild variant="outline" className="w-full"><Link to="/dashboard">Go to dashboard</Link></Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
