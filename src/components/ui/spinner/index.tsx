import React from "react";

// Spinner Size type definition
export type SpinnerSize = "sm" | "md" | "lg" | "xl";

// Spinner Color type definition
export type SpinnerColor = "primary" | "secondary" | "white" | "gray";

// Spinner components Props interface
export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  showText?: boolean;
  text?: string;
}

// size corresponding to CSS kind
const sizeMap: Record<SpinnerSize, string> = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-9 h-9",
  xl: "w-12 h-12",
};

// Color corresponding CSS kind
const colorMap: Record<SpinnerColor, string> = {
  primary: "border-brand-500",
  secondary: "border-gray-500",
  white: "border-white",
  gray: "border-gray-400",
};

const Spinner: React.FC<SpinnerProps> = ({ size = "md", color = "primary", className = "", showText = false, text = "Loading..." }) => {
  const sizeClass = sizeMap[size];
  const colorClass = colorMap[color];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClass} ${colorClass} border-3 border-t-transparent rounded-full animate-spin`} />
      {showText && <span className={`text-sm ${color === "white" ? "text-white" : "text-gray-600"}`}>{text}</span>}
    </div>
  );
};

export default Spinner;
