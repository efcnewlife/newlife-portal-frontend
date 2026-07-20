import { Modal, ProgressBar, Tooltip } from "@efcnewlife/newlife-ui";
import { useModal } from "@/hooks/useModal";
import { cn } from "@/utils";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MdDelete, MdImage } from "react-icons/md";
import { formatBytes } from "./utils";

interface FileInfo {
  name: string;
  size?: number;
  type?: string;
  nameClassName?: string;
}

interface ImagePreviewCardProps {
  imageUrl: string;
  alt: string;
  className?: string;
  topLeft?: ReactNode;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
  fileInfo?: FileInfo;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "success" | "error";
  message?: string;
  showUploadProgress?: boolean;
  enableImagePreview?: boolean;
}

const ImagePreviewCard = ({
  imageUrl,
  alt,
  className = "",
  topLeft,
  showDeleteButton = false,
  onDelete,
  onClick,
  fileInfo,
  uploadProgress,
  uploadStatus,
  showUploadProgress = false,
  message,
  enableImagePreview = true,
}: ImagePreviewCardProps) => {
  const { t } = useTranslation("content");
  const { isOpen: isPreviewOpen, openModal: openPreviewModal, closeModal: closePreviewModal } = useModal(false);

  const handleImageClick = () => {
    if (onClick) {
      onClick();
    } else if (enableImagePreview && imageUrl) {
      openPreviewModal();
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <div
          className={cn(
            "group relative aspect-square cursor-pointer overflow-hidden rounded-t-lg border-gray-200 transition-all dark:border-gray-700",
            className,
          )}
          onClick={handleImageClick}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              target.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='14'%3E%3F%3C/text%3E%3C/svg%3E";
            }}
          />
          {topLeft && <div className="absolute top-2 left-2 z-10">{topLeft}</div>}
          {showDeleteButton && onDelete && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
            >
              <MdDelete size={16} />
            </button>
          )}
        </div>

        {fileInfo && (
          <div className="space-y-1 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
            <Tooltip content={fileInfo.name} placement="bottom">
              <p
                className={cn(
                  "truncate text-xs font-medium",
                  fileInfo.nameClassName || "text-gray-700 dark:text-gray-300",
                )}
                title={fileInfo.name}
              >
                {fileInfo.name}
              </p>
            </Tooltip>
            {(fileInfo.size !== undefined || fileInfo.type) && (
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                {fileInfo.size !== undefined && <span>{formatBytes(fileInfo.size)}</span>}
                {fileInfo.type && (
                  <span className="flex items-center gap-1">
                    <MdImage size={12} />
                    {fileInfo.type}
                  </span>
                )}
              </div>
            )}
            {showUploadProgress && uploadStatus === "uploading" && typeof uploadProgress === "number" && (
              <div className="pt-2">
                <ProgressBar progress={uploadProgress} size="sm" label="inside" />
              </div>
            )}
            {showUploadProgress && uploadStatus === "error" && (
              <p className="pt-2 text-center text-[10px] text-red-600 dark:text-red-400">
                {message || t("file.upload.error")}
              </p>
            )}
            {showUploadProgress && uploadStatus === "success" && (
              <p className="pt-2 text-center text-[10px] text-green-600 dark:text-green-400">
                {message || t("file.upload.success")}
              </p>
            )}
          </div>
        )}
      </div>

      {enableImagePreview && (
        <Modal
          title={t("file.preview.title")}
          isOpen={isPreviewOpen}
          onClose={closePreviewModal}
          className="mx-4 h-auto w-auto max-h-[95vh] max-w-[95vw] p-6 shadow-none"
          showCloseButton
          isFullscreen={false}
        >
          <div className="flex flex-col items-center justify-center rounded-lg bg-gray-600 dark:bg-gray-900">
            <img
              src={imageUrl}
              alt={alt}
              className="m-4 max-h-[calc(90vh-120px)] max-w-full rounded-lg bg-transparent object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
            {fileInfo && (
              <div className="w-full rounded-b-lg bg-black/70 p-4 text-white backdrop-blur-sm">
                {fileInfo.name && (
                  <p className="mb-1 truncate text-sm font-medium" title={fileInfo.name}>
                    {fileInfo.name}
                  </p>
                )}
                {(fileInfo.size !== undefined || fileInfo.type) && (
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    {fileInfo.size !== undefined && <span>{formatBytes(fileInfo.size)}</span>}
                    {fileInfo.type && (
                      <span className="flex items-center gap-1">
                        <MdImage size={12} />
                        {fileInfo.type}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ImagePreviewCard;
