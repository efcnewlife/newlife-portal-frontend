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
import { MdUpload } from "react-icons/md";
import FileGrid from "./FileGrid";
import FileUploadForm, { type FileUploadFormHandle } from "./FileUploadForm";
import type { FileItem, SortOrder } from "./types";
import { appendUploadedFiles, convertFileGridItemToFileItem, convertSortOrderToApiParams } from "./utils";

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
  const [uploading, setUploading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileCacheRef = useRef<Map<string, FileItem>>(new Map());
  const fileUploadFormRef = useRef<FileUploadFormHandle>(null);

  const sortParams = useMemo(() => convertSortOrderToApiParams(sortOrder), [sortOrder]);

  useEffect(() => {
    if (!isOpen) {
      setIsUploadOpen(false);
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

  const selectedItemsFromKeys = useCallback((keys: string[]): FileItem[] => {
    return keys.map((id) => fileCacheRef.current.get(id)).filter((item): item is FileItem => Boolean(item));
  }, []);

  const handleCloseUpload = useCallback(() => {
    setIsUploadOpen(false);
    fileUploadFormRef.current?.clearFiles();
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!fileUploadFormRef.current?.validate()) {
      return;
    }
    const uploadFiles = fileUploadFormRef.current.getFiles();
    if (uploadFiles.length === 0) {
      return;
    }
    try {
      setUploading(true);
      const uploadedItems: FileItem[] = [];
      for (let index = 0; index < uploadFiles.length; index += 1) {
        const file = uploadFiles[index];
        fileUploadFormRef.current?.setUploadStatus(index, "uploading");
        try {
          const response = await fileService.uploadOne(file, "images", (progress) => {
            fileUploadFormRef.current?.setUploadProgress(index, progress);
          });
          if (response.success && response.data?.id) {
            const duplicate = response.data.duplicate === true;
            const message = duplicate ? t("file.upload.duplicateExisting") : t("file.upload.success");
            fileUploadFormRef.current?.setUploadStatus(index, "success", undefined, message);
            uploadedItems.push({
              id: response.data.id,
              url: "",
              name: file.name,
              size: file.size,
              contentType: file.type,
            });
          } else {
            fileUploadFormRef.current?.setUploadStatus(index, "error", response.message || t("file.upload.error"));
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : t("file.upload.error");
          fileUploadFormRef.current?.setUploadStatus(index, "error", message);
        }
      }
      uploadedItems.forEach((item) => {
        const cached = fileCacheRef.current.get(item.id);
        if (!cached) {
          fileCacheRef.current.set(item.id, item);
        }
      });
      await fetchPages();
      setSelectedKeys((prev) => {
        const mergedUploads = uploadedItems.map((item) => fileCacheRef.current.get(item.id) ?? item);
        const result = appendUploadedFiles(selectedItemsFromKeys(prev), mergedUploads, maxSelected);
        if (result.overCap) {
          onMaxReached?.();
        }
        result.items.forEach((item) => {
          fileCacheRef.current.set(item.id, item);
        });
        return result.items.map((item) => item.id);
      });
      handleCloseUpload();
    } finally {
      setUploading(false);
    }
  }, [fetchPages, handleCloseUpload, maxSelected, onMaxReached, selectedItemsFromKeys, t]);

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
      {
        key: "upload",
        text: t("file.picker.upload"),
        icon: <MdUpload className="size-4" />,
        align: "left",
        variant: "primary",
        size: "md",
        onClick: () => setIsUploadOpen(true),
        permission: Verb.Create,
      },
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
    const selectedFiles = selectedItemsFromKeys(selectedKeys);
    onConfirm(selectedFiles);
    onClose();
  }, [onClose, onConfirm, selectedItemsFromKeys, selectedKeys]);

  return (
    <Modal
      title={isUploadOpen ? t("file.picker.uploadTitle") : t("file.picker.title")}
      isOpen={isOpen}
      onClose={onClose}
      className="mx-4 flex max-h-[90vh] w-full max-w-[90vw] flex-col bg-white p-6 dark:bg-gray-900"
    >
      <div className="flex min-h-0 max-h-[calc(90vh-120px)] flex-1 flex-col">
        {!isUploadOpen && (
          <div className="shrink-0">
            <DataTableToolbar buttons={toolbarButtons} resource={Resource.ContentFile} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isUploadOpen ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <FileUploadForm ref={fileUploadFormRef} mediaCategory="images" />
            </div>
          ) : loading ? (
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
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  totalEntries={totalEntries}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          {isUploadOpen ? (
            <>
              <Button variant="outline" onClick={handleCloseUpload} disabled={uploading}>
                {t("file.upload.close")}
              </Button>
              <Button variant="primary" onClick={() => void handleFileUpload()} disabled={uploading}>
                {uploading ? t("file.upload.submitting") : t("file.upload.submit")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                {t("common:cancel")}
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                {t("file.picker.confirm", { count: selectedKeys.length })}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FileSelectionModal;
