import { cn } from "@/lib/utils";

export function Isotype({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="egr-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--primary-deep)" />
        </linearGradient>
      </defs>
      <path d="M20 2 36 11v18L20 38 4 29V11Z" fill="url(#egr-g)" />
      <path d="M13 13h14v3.2H17v2.6h8.4V22H17v2.8h10V28H13Z" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Isotype />
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-[0.12em]">
          EGRE<span className="text-primary">SANTOS</span>
        </span>
      )}
    </span>
  );
}
