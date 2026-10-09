import React, { useState } from "react";
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
  const [imageError, setImageError] = useState(false);

  const iconSizes = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-8 h-8 sm:w-9 sm:h-9",
    lg: "w-11 h-11 sm:w-12 sm:h-12",
  };

  const textSizes = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-xl sm:text-2xl",
  };

  const logoIcon = (
    <div className={`relative shrink-0 flex items-center justify-center ${iconSizes[size]}`}>
      {!imageError ? (
        <img
          src="/assets/manthan360-logo.svg"
          alt="Manthan360 Logo"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain shrink-0"
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`} id="manthan360-logo-icon">
        {logoIcon}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`} id="manthan360-logo-full">
      {logoIcon}
      <div className="flex items-center font-display font-black tracking-tight leading-none">
        <span className={`text-slate-100 light:text-slate-900 ${textSizes[size]}`}>
          Manthan
        </span>
        <span className={`text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 light:from-violet-600 light:to-indigo-600 font-extrabold ${textSizes[size]}`}>
          360
        </span>
      </div>
    </div>
  );
}

