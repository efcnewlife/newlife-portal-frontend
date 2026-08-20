import type { ReactNode } from "react";

interface StewardDetailSectionProps {
  title: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

const StewardDetailSection = ({ title, headerAction, children }: StewardDetailSectionProps) => {
  return (
    <section className="rounded-xl border border-gray-100 dark:border-white/[0.05] bg-gray-50/60 dark:bg-white/[0.02] overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.05]">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
};

export default StewardDetailSection;
