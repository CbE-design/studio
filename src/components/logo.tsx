import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-12 h-12 bg-primary rounded-full", className)}>
      <svg
        className="w-8 h-8 text-primary-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

export function LogoWithName({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo className="w-8 h-8" />
      <span className="text-xl font-bold font-headline text-sidebar-foreground">MoneyGO</span>
    </div>
  );
}
