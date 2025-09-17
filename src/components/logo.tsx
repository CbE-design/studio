import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-12 h-12 bg-primary rounded-lg", className)}>
      <svg
        className="w-8 h-8 text-primary-foreground"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2L3 7.5V16.5L12 22L21 16.5V7.5L12 2ZM5.18182 8.415L12 4.455L18.8182 8.415V15.585L12 19.545L5.18182 15.585V8.415Z" fill="#1A5D1A"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 4.455L5.18182 8.415V15.585L12 19.545L18.8182 15.585V8.415L12 4.455ZM9.43636 12.87L12 11.22L14.5636 12.87V15.585L12 14.28L9.43636 15.585V12.87ZM12 5.895L16.2273 8.415L13.6636 9.72L12 8.745L10.3364 9.72L7.77273 8.415L12 5.895Z" fill="white"/>
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
