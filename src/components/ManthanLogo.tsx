import React from "react";
import { Sparkles } from "lucide-react";

interface ManthanLogoProps {
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ManthanLogo({
  iconOnly = false,
  size = "md",
  className = "",
}: ManthanLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };

  const sparkSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="manthan360-logo-wrapper">
      {/* Icon Mark with Gradient */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0 border border-white/20`}
      >
        <Sparkles className={`${sparkSizes[size]} text-white`} />
      </div>

      {!iconOnly && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-sans font-black tracking-tight ${textSizes[size]} bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 dark:from-white dark:via-slate-100 dark:to-slate-300 light:from-rose-950 light:to-rose-800 leading-tight`}
          >
            Manthan360
          </span>
          <span className="text-[9px] font-mono tracking-wider text-violet-400 light:text-rose-900 font-semibold uppercase">
            Learn Beyond Notes
          </span>
        </div>
      )}
    </div>
  );
}
