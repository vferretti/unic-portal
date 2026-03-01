import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

function Empty({ title, description, icon: Icon = Search, className }: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center rounded-lg border", className)}>
      <Icon className="size-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
      )}
    </div>
  );
}

export { Empty };
