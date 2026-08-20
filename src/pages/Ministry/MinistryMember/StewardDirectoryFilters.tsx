import { Input, Select } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { MdSearch } from "react-icons/md";

interface StatusOption {
  value: string;
  label: string;
}

interface StewardDirectoryFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusOptions: StatusOption[];
}

const StewardDirectoryFilters = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
}: StewardDirectoryFiltersProps) => {
  const { t } = useTranslation("ministry");

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
      <Input
        id="steward-directory-q"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t("ministryMember.search.queryPlaceholder")}
        icon={<MdSearch className="size-5 text-on-surface-variant" aria-hidden />}
        clearable
        wrapperClassName="min-w-[16rem] flex-1"
      />
      <Select
        id="steward-directory-status"
        options={statusOptions}
        value={statusFilter}
        onChange={(value) => onStatusFilterChange(String(value ?? ""))}
        wrapperClassName="w-52 shrink-0"
      />
    </div>
  );
};

export default StewardDirectoryFilters;
