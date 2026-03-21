import { MdRefresh } from "react-icons/md";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ size = "md", text = "loading...", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative">
        <MdRefresh className={`${sizeClasses[size]} animate-spin text-blue-600`} aria-hidden="true" />
      </div>
      {text && <p className={`mt-4 text-gray-600 ${textSizes[size]} font-medium`}>{text}</p>}
    </div>
  );
}

// Full page loading component
export function FullPageLoading({ text = "Application loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading element
export function InlineLoading({ text = "loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size="sm" text={text} />
    </div>
  );
}
