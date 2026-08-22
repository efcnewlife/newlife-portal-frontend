import fileService from "@/api/services/fileService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DataTableFooter from "@/components/DataPage/DataTableFooter";
import DataTableToolbar from "@/components/DataPage/DataTableToolbar";
import { CommonPageButton } from "@/components/DataPage/PageButtonTypes";
import type { PageButtonType } from "@/components/DataPage/types";
import { Resource, Verb } from "@/const/enums";
import { notifyApiError } from "@/utils/operationFeedback";
import { Button, Modal, Select } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import FileGrid from "./FileGrid";
import type { FileItem, SortOrder } from "./types";
import { convertFileGridItemToFileItem, convertSortOrderToApiParams } from "./utils";

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

export interface FileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedFiles: FileItem[]) => void;
  initialSelectedItems?: FileItem[];
  maxSelected: number;
  onMaxReached?: () => void;
}

const FileSelectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedItems = [],
  maxSelected,
  onMaxReached,
}: FileSelectionModalProps) => {
  const { t } = useTranslation("content");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("date_desc");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const fileCacheRef = useRef<Map<string, FileItem>>(new Map());

  const sortParams = useMemo(() => convertSortOrderToApiParams(sortOrder), [sortOrder]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initialIds = initialSelectedItems.map((item) => item.id);
    setSelectedKeys(initialIds);
    initialSelectedItems.forEach((item) => {
      fileCacheRef.current.set(item.id, item);
    });
    setCurrentPage(1);
  }, [isOpen, initialSelectedItems]);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fileService.getPages({
        page: currentPage - 1,
        page_size: itemsPerPage,
        media_category: "images",
        ...sortParams,
      });
      if (response.success) {
        const items = (response.data.items || []).map(convertFileGridItemToFileItem);
        items.forEach((item) => {
          fileCacheRef.current.set(item.id, item);
        });
        setFiles(items);
        setTotalEntries(response.data.total);
      } else {
        setFiles([]);
        setTotalEntries(0);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortParams, t]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void fetchPages();
  }, [fetchPages, isOpen]);

  const totalPages = totalEntries > 0 ? Math.ceil(totalEntries / itemsPerPage) : 0;

  const handleFileSelect = useCallback(
    (fileId: string, checked: boolean) => {
      setSelectedKeys((prev) => {
        if (checked) {
          if (prev.includes(fileId)) {
            return prev;
          }
          if (prev.length >= maxSelected) {
            onMaxReached?.();
            return prev;
          }
          return [...prev, fileId];
        }
        return prev.filter((id) => id !== fileId);
      });
    },
    [maxSelected, onMaxReached]
  );

  const sortOptions = useMemo(
    () => [
      { value: "date_desc", label: t("file.sort.dateDesc") },
      { value: "date_asc", label: t("file.sort.dateAsc") },
      { value: "name_asc", label: t("file.sort.nameAsc") },
      { value: "name_desc", label: t("file.sort.nameDesc") },
      { value: "size_desc", label: t("file.sort.sizeDesc") },
      { value: "size_asc", label: t("file.sort.sizeAsc") },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.REFRESH(() => {
        void fetchPages();
      }),
      {
        key: "sort",
        text: t("file.toolbar.sort"),
        align: "right",
        size: "md",
        onClick: () => {},
        render: () => (
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {t("file.toolbar.sort")}
            </label>
            <Select
              id="room-gallery-file-sort"
              options={sortOptions}
              value={sortOrder}
              onChange={(value) => {
                setSortOrder(value as SortOrder);
                setCurrentPage(1);
              }}
              placeholder={t("file.toolbar.sortPlaceholder")}
              size="sm"
              variant="ghost"
              className="w-48"
            />
          </div>
        ),
        permission: Verb.Read,
      },
    ],
    [fetchPages, sortOptions, sortOrder, t]
  );

  const handleConfirm = useCallback(() => {
    const selectedFiles = selectedKeys
      .map((id) => fileCacheRef.current.get(id))
      .filter((item): item is FileItem => Boolean(item));
    onConfirm(selectedFiles);
    onClose();
  }, [onClose, onConfirm, selectedKeys]);

  return (
    <Modal
      title={t("file.picker.title")}
      isOpen={isOpen}
      onClose={onClose}
      className="mx-4 flex max-h-[90vh] w-full max-w-[90vw] flex-col bg-white p-6 dark:bg-gray-900"
    >
      <div className="flex min-h-0 max-h-[calc(90vh-120px)] flex-1 flex-col">
        <div className="shrink-0">
          <DataTableToolbar buttons={toolbarButtons} resource={Resource.ContentFile} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto border-x border-b border-gray-100 bg-white dark:border-white/[0.05] dark:bg-gray-900">
                <FileGrid files={files} selectedKeys={selectedKeys} onSelect={handleFileSelect} />
              </div>
              <div className="shrink-0">
                <DataTableFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  rowsPerPage={itemsPerPage}
                  totalEntries={totalEntries}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            {t("common:cancel")}
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            {t("file.picker.confirm", { count: selectedKeys.length })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileSelectionModal;
