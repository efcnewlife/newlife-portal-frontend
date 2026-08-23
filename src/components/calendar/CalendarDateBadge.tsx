interface CalendarDateBadgeProps {
  date: Date;
  locale?: string;
}

const CalendarDateBadge = ({ date, locale }: CalendarDateBadgeProps) => {
  const monthAbbr = date.toLocaleDateString(locale, { month: "short" }).toUpperCase();
  const day = date.getDate();

  return (
    <div className="flex w-12 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="flex items-center justify-center border-b border-gray-200 bg-gray-50 px-2 py-1 text-[9px] font-semibold tracking-wide text-gray-700 uppercase dark:border-white/10 dark:bg-gray-700 dark:text-gray-300">
        {monthAbbr}
      </div>
      <div className="flex items-center justify-center px-4 py-0.5 text-xl font-bold text-brand-500 dark:text-brand-400">
        {day}
      </div>
    </div>
  );
};

export default CalendarDateBadge;
