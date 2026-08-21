import { Checkbox } from "@efcnewlife/newlife-ui";
import ImagePreviewCard from "./ImagePreviewCard";
import type { FileItem } from "./types";
import { useTranslation } from "react-i18next";

interface FileGridProps {
  files: FileItem[];
  selectedKeys: string[];
  onSelect: (fileId: string, checked: boolean) => void;
}

const FileGrid = ({ files, selectedKeys, onSelect }: FileGridProps) => {
  const { t } = useTranslation("content");

  if (files.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl bg-white dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("file.browse.emptyImages")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
      {files.map((file) => {
        const isSelected = selectedKeys.includes(file.id);
        const topLeftElement = (
          <div
            className={`transition-opacity duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(file.id, !isSelected);
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => {}}
              className="pointer-events-none size-5 rounded-md border-white bg-white/90 shadow-md dark:border-gray-700 dark:bg-gray-900/90"
            />
          </div>
        );

        return (
          <div
            key={file.id}
            className="group flex flex-col gap-2 rounded-lg bg-white transition-colors dark:bg-gray-800"
          >
            <ImagePreviewCard
              imageUrl={file.url}
              alt={file.name}
              topLeft={topLeftElement}
              showDeleteButton={false}
              onClick={() => onSelect(file.id, !isSelected)}
              className="bg-gray-50 dark:bg-gray-900"
              fileInfo={{
                name: file.name,
                size: file.size,
              }}
              enableImagePreview
            />
          </div>
        );
      })}
    </div>
  );
};

export default FileGrid;
