import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg bg-white", className)}>
       <svg
        className="w-8 h-8"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" fill="#008A52"/>
        <path d="M62.5 12.5L87.5 27.5V72.5L62.5 87.5H37.5L12.5 72.5V27.5L37.5 12.5H62.5Z" fill="#00573D"/>
        <path d="M81.25 29.375V70.625L60.625 81.25H39.375L18.75 70.625V29.375L39.375 18.75H60.625L81.25 29.375Z" stroke="white" stroke-width="6.25"/>
        <path d="M60.625 18.75L39.375 43.75V81.25L60.625 56.25V18.75Z" fill="white"/>
      </svg>
    </div>
  );
}

export function LogoWithName({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo className="w-8 h-8" />
      <span className="text-xl font-bold font-headline text-sidebar-foreground">
        <span className="text-white">NEDBANK</span>
        <span style={{ color: '#F7C400' }}>MONEY</span>
      </span>
    </div>
  );
}
