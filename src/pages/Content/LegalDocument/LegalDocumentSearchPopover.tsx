import { PopoverType } from "@/components/DataPage";
import SearchPopoverContent from "@/components/DataPage/SearchPopoverContent";
import {
  LEGAL_DOCUMENT_KINDS,
  LEGAL_DOCUMENT_PRODUCTS,
  type LegalDocumentKind,
  type LegalDocumentProduct,
} from "@/pages/Content/LegalDocument/legalDocumentForm";
import { Select } from "@efcnewlife/newlife-ui";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface LegalDocumentSearchFilters {
  product?: LegalDocumentProduct | "";
  kind?: LegalDocumentKind | "";
}

interface LegalDocumentSearchPopoverProps {
  filters: LegalDocumentSearchFilters;
  onFiltersChange: (filters: LegalDocumentSearchFilters) => void;
  onSearch: (filters: LegalDocumentSearchFilters) => void;
  onClear: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  popover: PopoverType;
}

const LegalDocumentSearchPopover: React.FC<LegalDocumentSearchPopoverProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
  isOpen,
  onOpenChange,
  trigger,
  popover,
}) => {
  const { t } = useTranslation("content");

  const productOptions = [
    { value: "", label: t("legalDocument.search.allProducts") },
    ...LEGAL_DOCUMENT_PRODUCTS.map((value) => ({
      value,
      label: t(`legalDocument.product.${value}`),
    })),
  ];

  const kindOptions = [
    { value: "", label: t("legalDocument.search.allKinds") },
    ...LEGAL_DOCUMENT_KINDS.map((value) => ({
      value,
      label: t(`legalDocument.kind.${value}`),
    })),
  ];

  const chips: string[] = [];
  if (filters.product) chips.push(t(`legalDocument.product.${filters.product}`));
  if (filters.kind) chips.push(t(`legalDocument.kind.${filters.kind}`));

  return (
    <SearchPopoverContent
      onSearch={() => onSearch(filters)}
      onClear={onClear}
      trigger={trigger}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      popover={popover}
    >
      <div className="space-y-4">
        <Select
          id="legal-document-search-product"
          label={t("legalDocument.search.productLabel")}
          value={filters.product || ""}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              product: (value ? String(value) : "") as LegalDocumentProduct | "",
            })
          }
          options={productOptions}
        />
        <Select
          id="legal-document-search-kind"
          label={t("legalDocument.search.kindLabel")}
          value={filters.kind || ""}
          onChange={(value) =>
            onFiltersChange({
              ...filters,
              kind: (value ? String(value) : "") as LegalDocumentKind | "",
            })
          }
          options={kindOptions}
        />

        {chips.length > 0 ? (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t("legalDocument.search.chipsTitle")}</div>
            <div className="flex flex-wrap gap-1">
              {chips.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SearchPopoverContent>
  );
};

export default LegalDocumentSearchPopover;
