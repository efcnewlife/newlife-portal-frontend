import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { MdCloudUpload, MdWarning } from "react-icons/md";
import { Modal, ProgressBar } from "@efcnewlife/newlife-ui";
import { useModal } from "@/hooks/useModal";
import ImagePreviewCard from "./ImagePreviewCard";
import type { MediaCategory } from "./types";
import {
  FILE_ACCEPT,
  formatBytes,
  IMAGE_ACCEPT,
  isImageContentType,
  MAX_UPLOAD_SIZE_BYTES,
  MIXED_ACCEPT,
} from "./utils";

interface PreviewFile {
  file: File;
  preview: string;
  hash?: string;
  hashCalculating?: boolean;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "success" | "error";
  uploadError?: string;
  uploadMessage?: string;
  oversized?: boolean;
}

export interface FileUploadFormHandle {
  validate: () => boolean;
  getFiles: () => File[];
  clearFiles: () => void;
  setUploadProgress: (fileIndex: number, progress: number) => void;
  setUploadStatus: (
    fileIndex: number,
    status: "pending" | "uploading" | "success" | "error",
    error?: string,
    message?: string
  ) => void;
}

interface FileUploadFormProps {
  mediaCategory: MediaCategory;
  allowMixed?: boolean;
  defaultFiles?: File[];
}

const calculateFileHash = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const isImageFile = (file: File): boolean => {
  return isImageContentType(file.type);
};

const FileUploadForm = forwardRef<FileUploadFormHandle, FileUploadFormProps>(function FileUploadForm(
  { mediaCategory, allowMixed = false, defaultFiles = [] },
  ref
) {
  const { t } = useTranslation("content");
  const maxSizeLabel = formatBytes(MAX_UPLOAD_SIZE_BYTES);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>(() =>
    defaultFiles.map((file) => ({
      file,
      preview: isImageFile(file) ? URL.createObjectURL(file) : "",
      oversized: file.size > MAX_UPLOAD_SIZE_BYTES,
    }))
  );
  const [rejectedFiles, setRejectedFiles] = useState<Array<{ name: string; message: string }>>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [previewImageName, setPreviewImageName] = useState<string>("");
  const {
    isOpen: isImagePreviewOpen,
    openModal: openImagePreviewModal,
    closeModal: closeImagePreviewModal,
  } = useModal(false);
  const calculatingRef = useRef<Set<File>>(new Set());
  const processedFilesRef = useRef<string>("");

  const fileKeys = useMemo(() => {
    return previewFiles
      .map((previewFile) => `${previewFile.file.name}-${previewFile.file.size}-${previewFile.file.lastModified}`)
      .join("|");
  }, [previewFiles]);

  const accept = allowMixed ? MIXED_ACCEPT : mediaCategory === "images" ? IMAGE_ACCEPT : FILE_ACCEPT;
  const isImages = !allowMixed && mediaCategory === "images";
  const oversizedCount = useMemo(
    () =>
      previewFiles.filter((previewFile) => previewFile.oversized || previewFile.file.size > MAX_UPLOAD_SIZE_BYTES)
        .length,
    [previewFiles]
  );

  const setUploadProgress = (fileIndex: number, progress: number) => {
    setPreviewFiles((prev) =>
      prev.map((previewFile, index) =>
        index === fileIndex ? { ...previewFile, uploadProgress: progress, uploadStatus: "uploading" } : previewFile
      )
    );
  };

  const setUploadStatus = (
    fileIndex: number,
    status: "pending" | "uploading" | "success" | "error",
    error?: string,
    message?: string
  ) => {
    setPreviewFiles((prev) =>
      prev.map((previewFile, index) =>
        index === fileIndex
          ? { ...previewFile, uploadStatus: status, uploadError: error, uploadMessage: message }
          : previewFile
      )
    );
  };

  useEffect(() => {
    const calculateHashes = async () => {
      if (fileKeys === processedFilesRef.current) {
        return;
      }

      const filesToCalculate = previewFiles.filter(
        (previewFile) => !previewFile.hash && !calculatingRef.current.has(previewFile.file)
      );
      if (filesToCalculate.length === 0) {
        processedFilesRef.current = fileKeys;
        return;
      }

      filesToCalculate.forEach((previewFile) => calculatingRef.current.add(previewFile.file));
      setPreviewFiles((prev) =>
        prev.map((previewFile) => {
          const needsCalculation = filesToCalculate.some((item) => item.file === previewFile.file);
          if (needsCalculation && !previewFile.hashCalculating) {
            return { ...previewFile, hashCalculating: true };
          }
          return previewFile;
        })
      );

      const results = await Promise.all(
        filesToCalculate.map(async (previewFile) => {
          try {
            const hash = await calculateFileHash(previewFile.file);
            return { file: previewFile.file, hash };
          } catch {
            return { file: previewFile.file, hash: undefined };
          } finally {
            calculatingRef.current.delete(previewFile.file);
          }
        })
      );

      setPreviewFiles((prev) => {
        const updated = prev.map((previewFile) => {
          const result = results.find((item) => item.file === previewFile.file);
          if (result) {
            return { ...previewFile, hash: result.hash, hashCalculating: false };
          }
          return previewFile;
        });
        processedFilesRef.current = fileKeys;
        return updated;
      });
    };

    void calculateHashes();
  }, [fileKeys, previewFiles]);

  const duplicateHashes = useMemo(() => {
    const hashes = previewFiles.filter((previewFile) => previewFile.hash).map((previewFile) => previewFile.hash!);
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    hashes.forEach((hash) => {
      if (seen.has(hash)) {
        duplicates.add(hash);
      } else {
        seen.add(hash);
      }
    });
    return duplicates;
  }, [previewFiles]);

  const isFileDuplicate = (fileHash?: string): boolean => {
    if (!fileHash) return false;
    return duplicateHashes.has(fileHash);
  };

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      const nextRejectedFiles = fileRejections.map((rejection) => {
        const fileName = rejection.file.name;
        const fileSize = formatBytes(rejection.file.size);
        const isTooLarge = rejection.errors.some((error) => error.code === "file-too-large");
        const isInvalidType = rejection.errors.some((error) => error.code === "file-invalid-type");
        let message: string;
        if (isTooLarge) {
          message = t("file.upload.rejectedFileTooLarge", {
            name: fileName,
            size: fileSize,
            maxSize: maxSizeLabel,
          });
        } else if (isInvalidType) {
          message = t("file.upload.rejectedFileType", {
            name: fileName,
            size: fileSize,
          });
        } else {
          message = t("file.upload.rejectedFileOther", {
            name: fileName,
            size: fileSize,
          });
        }
        return { name: fileName, message };
      });
      setRejectedFiles(nextRejectedFiles);
    } else {
      setRejectedFiles([]);
    }

    if (acceptedFiles.length === 0) {
      return;
    }

    const newPreviewFiles: PreviewFile[] = acceptedFiles.map((file) => ({
      file,
      preview: isImageFile(file) ? URL.createObjectURL(file) : "",
      oversized: file.size > MAX_UPLOAD_SIZE_BYTES,
    }));
    setPreviewFiles((prev) => [...prev, ...newPreviewFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
    maxSize: MAX_UPLOAD_SIZE_BYTES,
  });

  const handleRemoveFile = (index: number) => {
    setPreviewFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, fileIndex) => fileIndex !== index);
    });
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (previewFiles.length === 0) {
        return false;
      }
      if (previewFiles.some((previewFile) => previewFile.hashCalculating)) {
        return false;
      }
      if (duplicateHashes.size > 0) {
        return false;
      }
      if (previewFiles.some((previewFile) => previewFile.oversized || previewFile.file.size > MAX_UPLOAD_SIZE_BYTES)) {
        return false;
      }
      return true;
    },
    getFiles: () => previewFiles.map((previewFile) => previewFile.file),
    clearFiles: () => {
      previewFiles.forEach((previewFile) => {
        if (previewFile.preview) {
          URL.revokeObjectURL(previewFile.preview);
        }
      });
      setPreviewFiles([]);
      setRejectedFiles([]);
    },
    setUploadProgress,
    setUploadStatus,
  }));

  const acceptHint = allowMixed
    ? t("file.upload.acceptMixed")
    : isImages
      ? t("file.upload.acceptImages")
      : t("file.upload.acceptFiles");

  return (
    <div className="flex h-full flex-col gap-6">
      <div
        {...getRootProps()}
        className={`flex min-h-40 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragActive
            ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20"
            : "border-gray-300 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-700"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <MdCloudUpload size={32} />
            </div>
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            {isDragActive ? t("file.upload.dropActive") : t("file.upload.dropHint")}
          </h4>
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{acceptHint}</p>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t("file.upload.maxSizeHint", { size: maxSizeLabel })}
          </p>
          <span className="text-sm font-medium text-brand-500 underline">{t("file.upload.browse")}</span>
        </div>
      </div>

      {rejectedFiles.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-300">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <MdWarning size={16} />
            <span>{t("file.upload.rejectedTitle")}</span>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {rejectedFiles.map((rejectedFile) => (
              <li key={`${rejectedFile.name}-${rejectedFile.message}`} className="break-all">
                {rejectedFile.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewFiles.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col space-y-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("file.upload.selectedCount", { count: previewFiles.length })}
            </h5>
            <div className="flex flex-wrap items-center gap-3">
              {oversizedCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <MdWarning size={16} />
                  <span>{t("file.upload.oversized", { count: oversizedCount })}</span>
                </div>
              )}
              {duplicateHashes.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <MdWarning size={16} />
                  <span>{t("file.upload.duplicates", { count: duplicateHashes.size })}</span>
                </div>
              )}
            </div>
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {isImages ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {previewFiles.map((previewFile, index) => {
                  const isDuplicate = isFileDuplicate(previewFile.hash);
                  const isOversized = Boolean(previewFile.oversized || previewFile.file.size > MAX_UPLOAD_SIZE_BYTES);
                  const isCalculating = previewFile.hashCalculating;
                  const isInvalid = isDuplicate || isOversized;
                  const topLeftElement = isOversized ? (
                    <div className="flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-white">
                      <MdWarning size={14} />
                      <span className="ml-1 text-xs font-semibold">{t("file.upload.oversizedBadge")}</span>
                    </div>
                  ) : isDuplicate ? (
                    <div className="flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-white">
                      <MdWarning size={14} />
                      <span className="ml-1 text-xs font-semibold">{t("file.upload.duplicateBadge")}</span>
                    </div>
                  ) : isCalculating ? (
                    <div className="flex items-center justify-center rounded-full bg-gray-500 px-2 py-1 text-white">
                      <span className="text-xs font-semibold">{t("file.upload.checking")}</span>
                    </div>
                  ) : undefined;

                  return (
                    <div
                      key={`${previewFile.file.name}-${index}`}
                      className={`flex flex-col overflow-hidden rounded-lg transition-colors ${
                        isInvalid
                          ? "border border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <ImagePreviewCard
                        imageUrl={previewFile.preview}
                        alt={previewFile.file.name}
                        topLeft={topLeftElement}
                        onDelete={() => handleRemoveFile(index)}
                        className={
                          isInvalid
                            ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                            : "bg-gray-50 dark:bg-gray-900"
                        }
                        showDeleteButton
                        fileInfo={{
                          name: previewFile.file.name,
                          size: previewFile.file.size,
                          type: previewFile.file.type || t("file.upload.unknownType"),
                          nameClassName: isInvalid
                            ? "text-red-700 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300",
                        }}
                        showUploadProgress
                        uploadProgress={previewFile.uploadProgress}
                        uploadStatus={previewFile.uploadStatus}
                        message={
                          isOversized
                            ? t("file.upload.fileTooLarge", { size: maxSizeLabel })
                            : previewFile.uploadStatus === "error"
                              ? previewFile.uploadError
                              : previewFile.uploadMessage
                        }
                        enableImagePreview
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {previewFiles.map((previewFile, index) => {
                  const isDuplicate = isFileDuplicate(previewFile.hash);
                  const isOversized = Boolean(previewFile.oversized || previewFile.file.size > MAX_UPLOAD_SIZE_BYTES);
                  const isInvalid = isDuplicate || isOversized;
                  const showImagePreview = Boolean(previewFile.preview) && isImageFile(previewFile.file);

                  return (
                    <div
                      key={`${previewFile.file.name}-${index}`}
                      className={`rounded-lg border p-3 ${
                        isInvalid
                          ? "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/20"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {showImagePreview ? (
                            <button
                              type="button"
                              className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                              onClick={() => {
                                setPreviewImageUrl(previewFile.preview);
                                setPreviewImageName(previewFile.file.name);
                                openImagePreviewModal();
                              }}
                              aria-label={previewFile.file.name}
                            >
                              <img
                                src={previewFile.preview}
                                alt={previewFile.file.name}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white/90">
                              {previewFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatBytes(previewFile.file.size)} ·{" "}
                              {previewFile.file.type || t("file.upload.unknownType")}
                            </p>
                            {previewFile.uploadStatus === "uploading" &&
                              typeof previewFile.uploadProgress === "number" && (
                                <div className="mt-2">
                                  <ProgressBar progress={previewFile.uploadProgress} size="sm" label="inside" />
                                </div>
                              )}
                            {previewFile.uploadStatus === "error" && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {previewFile.uploadError || t("file.upload.error")}
                              </p>
                            )}
                            {previewFile.uploadStatus === "success" && (
                              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                {previewFile.uploadMessage || t("file.upload.success")}
                              </p>
                            )}
                            {isOversized && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {t("file.upload.fileTooLarge", { size: maxSizeLabel })}
                              </p>
                            )}
                            {isDuplicate && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {t("file.upload.duplicateBadge")}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-sm text-gray-500 hover:text-red-500"
                        >
                          {t("file.upload.remove")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        title={previewImageName || t("file.preview.title")}
        isOpen={isImagePreviewOpen}
        onClose={closeImagePreviewModal}
        className="mx-4 w-full max-w-[720px] p-4"
      >
        {previewImageUrl ? (
          <img src={previewImageUrl} alt={previewImageName} className="max-h-[70vh] w-full object-contain" />
        ) : null}
      </Modal>
    </div>
  );
});

FileUploadForm.displayName = "FileUploadForm";

export default FileUploadForm;
