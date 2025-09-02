import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold">Van Schalkwyk Trust</h1>
      </div>
      <Avatar>
        <AvatarImage src="https://picsum.photos/100" data-ai-hint="person" alt="User avatar" width={100} height={100} />
        <AvatarFallback>VT</AvatarFallback>
      </Avatar>
    </header>
  );
}
