import React from "react";

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
  const heights = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  const iconDimensions = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`} id="manthan360-logo-icon">
        <img
          src="/assets/manthan360-logo.png"
          alt="Manthan360"
          className={`${iconDimensions[size]} object-contain object-left shrink-0`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} id="manthan360-logo-full">
      <img
        src="/assets/manthan360-logo.png"
        alt="Manthan360"
        className={`${heights[size]} w-auto max-w-full object-contain shrink-0`}
      />
    </div>
  );
}
