import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initial(name?: string | null, email?: string | null) {
  const src = name || email || "?";
  return src.trim().charAt(0).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u || cancelled) return;
      setEmail(u.email ?? null);
      const meta = (u.user_metadata as any) || {};
      setName(meta.name ?? null);
      const { data: p } = await supabase.from("profiles").select("name").eq("id", u.id).maybeSingle();
      if (!cancelled && p?.name) setName(p.name);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-sm ring-1 ring-primary/20 transition hover:brightness-110"
        >
          {initial(name, email)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name || "Your account"}</span>
            {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
