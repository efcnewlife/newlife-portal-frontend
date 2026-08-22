import type { FacilityTranslationItem } from "@/api/services/facilityService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import { useModal } from "@/hooks/useModal";
import FileSelectionModal from "@/pages/Content/File/FileSelectionModal";
import ImagePreviewCard from "@/pages/Content/File/ImagePreviewCard";
import type { FileItem } from "@/pages/Content/File/types";
import { cn } from "@/utils";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { Button, Checkbox, FormField, Input } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd } from "react-icons/md";
import {
  ROOM_GALLERY_MAX_FILES,
  applyPickerSelection,
  galleryFileIds,
  hydrateGalleryFromFiles,
  reorderGallery,
  validateGallery,
  type RoomGalleryFile,
} from "./roomGallery";

export interface RoomFormValues {
  code: string;
  name?: string;
  roomNumber?: string;
  capacity?: number;
  isActive?: boolean;
  description?: string;
  translations?: FacilityTranslationItem[];
  files?: RoomGalleryFile[];
  fileIds?: string[];
}

export interface RoomDataFormHandle {
  validate: () => boolean;
  getValues: () => RoomFormValues;
}

const RoomDataForm = forwardRef<
  RoomDataFormHandle,
  { mode: "create" | "edit"; defaultValues?: Partial<RoomFormValues> | null }
>(function RoomDataForm({ mode, defaultValues }, ref) {
  const { t } = useTranslation("facility");
  const { t: tCommon } = useTranslation("common");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [code, setCode] = useState(defaultValues?.code || "");
  const [roomNumber, setRoomNumber] = useState(defaultValues?.roomNumber || "");
  const [capacity, setCapacity] = useState<string>(
    defaultValues?.capacity !== undefined ? String(defaultValues.capacity) : ""
  );
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [galleryItems, setGalleryItems] = useState<FileItem[]>([]);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ code?: string; name?: string; gallery?: string }>({});
  const { isOpen: isPickerOpen, openModal: openPicker, closeModal: closePicker } = useModal(false);

  useEffect(() => {
    if (locales.length === 0) return;
    setCode(defaultValues?.code || "");
    setRoomNumber(defaultValues?.roomNumber || "");
    setCapacity(defaultValues?.capacity !== undefined ? String(defaultValues.capacity) : "");
    setIsActive(defaultValues?.isActive ?? true);
    setGalleryItems(hydrateGalleryFromFiles(defaultValues?.files));
    setTranslationMap(
      hydrateTranslationMap(locales, defaultValues?.translations, {
        name: defaultValues?.name,
        description: defaultValues?.description,
      })
    );
  }, [defaultValues, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const galleryErrorMessage = (error: ReturnType<typeof validateGallery>): string | undefined => {
    if (error === "max") return t("room.form.galleryMax", { max: ROOM_GALLERY_MAX_FILES });
    if (error === "duplicate") return t("room.form.galleryDuplicate");
    return undefined;
  };

  const validate = (): boolean => {
    const next: { code?: string; name?: string; gallery?: string } = {};
    if (mode === "create" && !code.trim()) next.code = t("room.form.codeRequired");
    const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
    if (name_error_key) next.name = tCommon(name_error_key);
    const galleryError = validateGallery(galleryItems);
    if (galleryError) next.gallery = galleryErrorMessage(galleryError);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useImperativeHandle(ref, () => ({
    validate,
    getValues: () => {
      const translations = buildTranslationPayload(translationMap);
      return {
        code: code.trim(),
        roomNumber: roomNumber.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        isActive,
        translations,
        fileIds: galleryFileIds(galleryItems),
      };
    },
  }));

  const handlePickerConfirm = (picked: FileItem[]) => {
    const result = applyPickerSelection(galleryItems, picked);
    if (result.overCap) {
      setErrors((prev) => ({ ...prev, gallery: galleryErrorMessage("max") }));
      return;
    }
    setGalleryItems(result.items);
    setErrors((prev) => ({ ...prev, gallery: undefined }));
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {mode === "create" && (
            <div>
              <Input
                id="room-code"
                label={t("room.form.code")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={errors.code}
              />
            </div>
          )}
          <div>
            <Input
              id="room-number"
              label={t("room.form.roomNumber")}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
            />
          </div>
          <div>
            <Input
              id="room-capacity"
              label={t("room.form.capacity")}
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              hint={t("room.form.capacityHint")}
            />
          </div>
        </div>
        <Checkbox id="room-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
        <FormField
          id="room-gallery"
          label={t("room.form.gallery")}
          hint={errors.gallery ? undefined : t("room.form.galleryHint", { max: ROOM_GALLERY_MAX_FILES })}
          error={errors.gallery}
        >
          <div className="space-y-3">
            <Button btnType="button" variant="outline" size="sm" onClick={openPicker}>
              <MdAdd className="mr-2" size={16} />
              {t("room.form.galleryPick")}
            </Button>
            {galleryItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("room.form.gallerySelected", { count: galleryItems.length, max: ROOM_GALLERY_MAX_FILES })}
                </div>
                <div className="grid max-h-[400px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
                  {galleryItems.map((file, index) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={() => setDragFromIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragFromIndex === null) return;
                        setGalleryItems((prev) => reorderGallery(prev, dragFromIndex, index));
                        setDragFromIndex(null);
                      }}
                      onDragEnd={() => setDragFromIndex(null)}
                      className={cn("cursor-grab", dragFromIndex === index && "opacity-60")}
                    >
                      <ImagePreviewCard
                        imageUrl={file.url}
                        alt={file.name}
                        showDeleteButton
                        enableImagePreview={false}
                        onDelete={() => {
                          setGalleryItems((prev) => prev.filter((item) => item.id !== file.id));
                          setErrors((prev) => ({ ...prev, gallery: undefined }));
                        }}
                        fileInfo={{ name: file.name, size: file.size }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </FormField>
        <TranslationTabsForm
          locales={locales}
          defaultLocaleId={defaultLocaleId}
          value={translationMap}
          onChange={setTranslationMap}
          fields={["name", "description"]}
          loading={loading}
          error={error}
          nameError={errors.name ? tCommon(errors.name) : undefined}
          labels={{
            name: t("room.form.name"),
            description: t("room.form.description"),
          }}
        />
      </div>
      <FileSelectionModal
        isOpen={isPickerOpen}
        onClose={closePicker}
        onConfirm={handlePickerConfirm}
        initialSelectedItems={galleryItems}
        maxSelected={ROOM_GALLERY_MAX_FILES}
        onMaxReached={() => setErrors((prev) => ({ ...prev, gallery: galleryErrorMessage("max") }))}
      />
    </>
  );
});

export default RoomDataForm;
