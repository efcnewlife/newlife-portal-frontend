import AuthLocaleSelect from "@/components/auth/AuthLocaleSelect";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <AuthLocaleSelect />
      </div>
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
      </div>
    </div>
  );
}
