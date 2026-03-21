import { MdErrorOutline, MdHome } from "react-icons/md";
import { Link } from "react-router";
import { ENV_CONFIG } from "@/config/env";
import PageMeta from "../../components/common/PageMeta";
import { cn } from "../../utils";

export default function NotFound() {
  return (
    <>
      <PageMeta title="Resource Not Found" description="The resource you are looking for does not exist." />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <div className="mx-auto w-full max-w-[600px] text-center">
          {/* Large 404 text */}
          <div className="relative mb-8">
            <h1 className="text-[120px] sm:text-[180px] md:text-[220px] font-bold leading-none text-[#ffcc35]">404</h1>
            {/* Decorative circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-[#ffcc35]/10 dark:bg-[#ffcc35]/20 blur-3xl -z-10" />
          </div>

          {/* Icon and title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <MdErrorOutline className="size-8 sm:size-10 text-gray-600 dark:text-gray-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white/90">Page Not Found</h2>
          </div>

          {/* Description */}
          <p className="mb-8 text-base text-gray-700 dark:text-gray-400 sm:text-lg max-w-md mx-auto">
            We can't seem to find the page you are looking for! The page might have been moved, deleted, or the URL might be incorrect.
          </p>

          {/* Back-to-home button */}
          <Link
            to="/"
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "rounded-lg border border-gray-300 bg-white px-6 py-3.5",
              "text-sm font-medium text-gray-700",
              "shadow-theme-xs",
              "hover:bg-gray-50 hover:text-gray-800 hover:shadow-md",
              "transition-all duration-200",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
              "dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            )}
          >
            <MdHome className="size-5" />
            Back to Home Page
          </Link>
        </div>
        {/* Footer */}
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - {ENV_CONFIG.APP_NAME}
        </p>
      </div>
    </>
  );
}
