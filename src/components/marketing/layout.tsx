import { useEffect, type ReactNode } from "react";
import { MarketingNav } from "./nav";
import { MarketingFooter } from "./footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  // Marketing pages are always presented in light mode. The theme toggle is
  // only available after the user signs in.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (hadDark) root.classList.add("dark");
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNav />
      <main className="relative flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
