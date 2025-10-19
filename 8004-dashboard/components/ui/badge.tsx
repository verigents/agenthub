import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md bg-[#141532] ring-1 ring-white/15 px-2 py-0.5 text-xs text-white/80", className)}>
      {children}
    </span>
  );
}


