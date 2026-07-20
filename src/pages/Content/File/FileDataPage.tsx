import fileService from "@/api/services/fileService";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import DataTableFooter from "@/components/DataPage/DataTableFooter";
import DataTableToolbar from "@/components/DataPage/DataTableToolbar";
import { CommonPageButton } from "@/components/DataPage/PageButtonTypes";
import type { PageButtonType } from "@/components/DataPage/types";
import { Resource, Verb } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { Button, Modal, ModalForm, Select, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdCheckBox, MdCheckBoxOutlineBlank, MdUpload } from "react-icons/md";
import FileDeleteForm from "./FileDeleteForm";
import FileGrid from "./FileGrid";
import FileTableList from "./FileTableList";
import FileUploadForm, { type FileUploadFormHandle } from "./FileUploadForm";
import MediaCategoryCards from "./MediaCategoryCards";
import StorageDetailsCard from "./StorageDetailsCard";
import type { FileItem, FileSummaryResponse, MediaCategory, SortOrder } from "./types";
import { convertFileGridItemToFileItem, convertSortOrderToApiParams, mediaCategoryLabelKey, resolveMediaCategoryFromFile } from "./utils";

const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

const FileDataPage = () => {
  const { t } = useTranslation("content");
  const [mediaCategory, setMediaCategory] = useState<MediaCategory>("images");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("date_desc");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FileSummaryResponse | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allowMixedUpload, setAllowMixedUpload] = useState(false);

  const { isOpen: isUploadModalOpen, openModal: openUploadModal, closeModal: closeUploadModal } = useModal();
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const openMixedUploadModal = useCallback(() => {
    setAllowMixedUpload(true);
    openUploadModal();
  }, [openUploadModal]);

  const openCategoryUploadModal = useCallback(() => {
    setAllowMixedUpload(false);
    openUploadModal();
  }, [openUploadModal]);

  const fileUploadFormRef = useRef<FileUploadFormHandle>(null);
  const fileUploadModalFormRef = useRef<ModalFormHandle>(null);

  const sortParams = useMemo(() => convertSortOrderToApiParams(sortOrder), [sortOrder]);

  const fetchSummary = useCallback(async () => {
    const response = await fileService.getSummary();
    if (response.success) {
      setSummary(response.data);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fileService.getPages({
        page: currentPage - 1,
        page_size: itemsPerPage,
        media_category: mediaCategory,
        ...sortParams,
      });
      if (response.success) {
        const items = (response.data.items || []).map(convertFileGridItemToFileItem);
        setFiles(items);
        setTotalEntries(response.data.total);
      } else {
        setFiles([]);
        setTotalEntries(0);
      }
    } catch {
      alert(t("file.browse.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, mediaCategory, sortParams, t]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchPages()]);
  }, [fetchPages, fetchSummary]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const handleCategoryChange = useCallback((category: MediaCategory) => {
    setMediaCategory(category);
    setCurrentPage(1);
    setSelectedKeys([]);
  }, []);

  const totalPages = totalEntries > 0 ? Math.ceil(totalEntries / itemsPerPage) : 0;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const handleFileSelect = useCallback((fileId: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      if (checked) {
        return prev.includes(fileId) ? prev : [...prev, fileId];
      }
      return prev.filter((id) => id !== fileId);
    });
  }, []);

  const isAllSelected = useMemo(() => {
    if (files.length === 0) return false;
    return files.every((file) => selectedKeys.includes(file.id));
  }, [files, selectedKeys]);

  const handleSelectAll = useCallback(() => {
    const currentPageIds = files.map((file) => file.id);
    if (isAllSelected) {
      setSelectedKeys((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }
    setSelectedKeys((prev) => {
      const nextKeys = [...prev];
      currentPageIds.forEach((id) => {
        if (!nextKeys.includes(id)) {
          nextKeys.push(id);
        }
      });
      return nextKeys;
    });
  }, [files, isAllSelected]);

  const handleBatchDelete = useCallback(() => {
    if (selectedKeys.length === 0) {
      return;
    }
    openDeleteModal();
  }, [openDeleteModal, selectedKeys.length]);

  const handleDeleteConfirm = useCallback(async () => {
    if (selectedKeys.length === 0) {
      return;
    }
    try {
      setDeleting(true);
      const response = await fileService.bulkDelete({ ids: selectedKeys });
      if (response.success) {
        setSelectedKeys([]);
        closeDeleteModal();
        await refreshAll();
      }
    } catch {
      alert(t("file.delete.failed"));
    } finally {
      setDeleting(false);
    }
  }, [closeDeleteModal, refreshAll, selectedKeys, t]);

  const handleDeleteOne = useCallback(
    (fileId: string) => {
      setSelectedKeys([fileId]);
      openDeleteModal();
    },
    [openDeleteModal],
  );

  const handleCloseUploadModal = useCallback(async () => {
    closeUploadModal();
    setAllowMixedUpload(false);
    fileUploadFormRef.current?.clearFiles();
    await refreshAll();
  }, [closeUploadModal, refreshAll]);

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
      const concurrency = 3;
      let nextIndex = 0;

      const uploadOneAtIndex = async (index: number) => {
        const file = uploadFiles[index];
        const categoryForFile = allowMixedUpload ? resolveMediaCategoryFromFile(file) : mediaCategory;
        fileUploadFormRef.current?.setUploadStatus(index, "uploading");
        try {
          const response = await fileService.uploadOne(file, categoryForFile, (progress) => {
            fileUploadFormRef.current?.setUploadProgress(index, progress);
          });
          if (response.success) {
            const duplicate = response.data?.duplicate === true;
            const message = duplicate ? t("file.upload.duplicateExisting") : t("file.upload.success");
            fileUploadFormRef.current?.setUploadStatus(index, "success", undefined, message);
          } else {
            fileUploadFormRef.current?.setUploadStatus(index, "error", response.message || t("file.upload.error"));
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : t("file.upload.error");
          fileUploadFormRef.current?.setUploadStatus(index, "error", message);
        }
      };

      const worker = async () => {
        while (true) {
          const current = nextIndex;
          if (current >= uploadFiles.length) {
            return;
          }
          nextIndex += 1;
          await uploadOneAtIndex(current);
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, uploadFiles.length) }, () => worker());
      await Promise.all(workers);
    } finally {
      setUploading(false);
    }
  }, [allowMixedUpload, mediaCategory, t]);

  const sortOptions = useMemo(
    () => [
      { value: "date_desc", label: t("file.sort.dateDesc") },
      { value: "date_asc", label: t("file.sort.dateAsc") },
      { value: "name_asc", label: t("file.sort.nameAsc") },
      { value: "name_desc", label: t("file.sort.nameDesc") },
      { value: "size_desc", label: t("file.sort.sizeDesc") },
      { value: "size_asc", label: t("file.sort.sizeAsc") },
    ],
    [t],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      {
        key: "upload",
        text: t("file.toolbar.upload"),
        icon: <MdUpload className="size-4" />,
        align: "left",
        variant: "primary",
        size: "md",
        onClick: openCategoryUploadModal,
        permission: Verb.Create,
      },
      {
        key: "selectAll",
        text: isAllSelected ? t("file.toolbar.deselectAll") : t("file.toolbar.selectAll"),
        icon: isAllSelected ? <MdCheckBox className="size-4" /> : <MdCheckBoxOutlineBlank className="size-4" />,
        align: "left",
        disabled: files.length === 0,
        size: "md",
        onClick: handleSelectAll,
        permission: Verb.Delete,
      },
      CommonPageButton.BULK_DELETE(handleBatchDelete, {
        align: "left",
        tooltip: t("file.toolbar.delete"),
        size: "md",
        disabled: selectedKeys.length === 0,
        permission: Verb.Delete,
      }),
      CommonPageButton.REFRESH(() => {
        void refreshAll();
      }),
      {
        key: "sort",
        text: t("file.toolbar.sort"),
        align: "right",
        size: "md",
        onClick: () => {},
        render: () => (
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{t("file.toolbar.sort")}</label>
            <Select
              id="file-sort-select"
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
    [
      files.length,
      handleBatchDelete,
      handleSelectAll,
      isAllSelected,
      openCategoryUploadModal,
      refreshAll,
      selectedKeys.length,
      sortOptions,
      sortOrder,
      t,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MediaCategoryCards
          summary={summary}
          activeCategory={mediaCategory}
          onCategoryChange={handleCategoryChange}
          onUploadClick={openMixedUploadModal}
        />
        <StorageDetailsCard summary={summary} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <DataTableToolbar buttons={toolbarButtons} resource={Resource.ContentFile} />

        <div className="border-b border-gray-100 px-5 py-3 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300 md:px-6">
          {t("file.browse.showing", {
            category: t(mediaCategoryLabelKey(mediaCategory)),
            count: totalEntries,
          })}
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : mediaCategory === "images" ? (
            <FileGrid files={files} selectedKeys={selectedKeys} onSelect={handleFileSelect} />
          ) : (
            <FileTableList files={files} selectedKeys={selectedKeys} onSelect={handleFileSelect} onDeleteOne={handleDeleteOne} />
          )}
        </div>

        <DataTableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={itemsPerPage}
          totalEntries={totalEntries}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleItemsPerPageChange}
        />
      </section>

      <ModalForm
        ref={fileUploadModalFormRef}
        title={allowMixedUpload ? t("file.upload.titleMixed") : t("file.upload.title")}
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        className="flex h-screen w-full flex-col self-stretch p-4 md:p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleCloseUploadModal} disabled={uploading}>
              {t("file.upload.close")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => fileUploadModalFormRef.current?.submit()} disabled={uploading}>
              {uploading ? t("file.upload.submitting") : t("file.upload.submit")}
            </Button>
          </>
        }
        onSubmit={async (event) => {
          event.preventDefault();
          await handleFileUpload();
        }}
        isFullscreen
      >
        <FileUploadForm ref={fileUploadFormRef} mediaCategory={mediaCategory} allowMixed={allowMixedUpload} />
      </ModalForm>

      <Modal title={t("file.delete.title")} isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="mx-4 w-full max-w-[560px] p-6">
        <FileDeleteForm fileCount={selectedKeys.length} onSubmit={handleDeleteConfirm} onCancel={closeDeleteModal} submitting={deleting} />
      </Modal>
    </div>
  );
};

export default FileDataPage;
