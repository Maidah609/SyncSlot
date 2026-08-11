import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-7 w-7", text: "text-lg" },
  md: { box: "h-9 w-9", text: "text-2xl" },
  lg: { box: "h-11 w-11", text: "text-3xl" },
};

export function LogoMark({ size = "md", className }: { size?: Size; className?: string }) {
  const s = sizes[size];
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden
      className={cn("rounded-[10px] object-cover shadow-sm", s.box, className)}
    />
  );
}

export function Logo({
  size = "md",
  showWord = true,
  to = "/",
  className,
}: {
  size?: Size;
  showWord?: boolean;
  to?: string;
  className?: string;
}) {
  const s = sizes[size];
  const content = (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showWord && <span className={cn("font-display tracking-tight", s.text)}>SyncSlot</span>}
    </span>
  );
  if (!to) return content;
  return (
    <Link to={to} className="flex items-center">
      {content}
    </Link>
  );
}
