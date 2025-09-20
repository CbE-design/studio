import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg bg-white", className)}>
       <svg
        className="w-8 h-8 text-primary"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M25.0002 0L50 14.4338V43.3013L25.0002 57.735L0 43.3013V14.4338L25.0002 0Z"
          fill="#00573D"
        ></path>
        <path
          d="M25.0002 4.81122L45.1925 16.8524V40.8825L25.0002 52.9238L4.80791 40.8825V16.8524L25.0002 4.81122Z"
          fill="#009C6D"
        ></path>
        <path
          d="M25 9.62244L4.80771 21.6636V36.0713L25 48.1125L45.1923 36.0713V21.6636L25 9.62244Z"
          fill="#25A95A"
        ></path>
        <path
          d="M25.0002 14.4338L45.1925 26.475V31.2862L25.0002 43.3274L4.80791 31.2862V26.475L25.0002 14.4338Z"
          fill="#FFFFFF"
        ></path>
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
