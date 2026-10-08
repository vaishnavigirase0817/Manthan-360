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

  const heights = {
    sm: "h-7 sm:h-8",
    md: "h-8 sm:h-9",
    lg: "h-11 sm:h-12",
  };

  const iconDimensions = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-8 h-8 sm:w-9 sm:h-9",
    lg: "w-11 h-11 sm:w-12 sm:h-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`} id="manthan360-logo-icon">
        {!imageError ? (
          <img
            src="/assets/manthan360-logo.png"
            alt="Manthan360"
            onError={() => setImageError(true)}
            className={`${iconDimensions[size]} object-contain shrink-0`}
          />
        ) : (
          <div className={`${iconDimensions[size]} rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`} id="manthan360-logo-full">
      {!imageError ? (
        <img
          src="/assets/manthan360-logo.png"
          alt="Manthan360"
          onError={() => setImageError(true)}
          className={`${heights[size]} w-auto max-w-[140px] sm:max-w-none object-contain shrink-0`}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-white to-fuchsia-300 ${textSizes[size]}`}>
            Manthan360
          </span>
        </div>
      )}
    </div>
  );
}
