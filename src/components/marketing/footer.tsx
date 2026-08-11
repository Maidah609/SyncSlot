import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <Logo size="sm" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} SyncSlot. Scheduling, calmly done.
        </p>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
