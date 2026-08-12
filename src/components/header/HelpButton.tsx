import { useModal } from "@/hooks/useModal";
import { Button, Modal } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { MdOutlineHelpOutline } from "react-icons/md";

const HELP_SECTION_KEYS = ["navigation", "listPages", "contextMenu", "recycle", "appearance"] as const;

export const HelpButton: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal(false);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={t("common:help.button")}
        title={t("common:help.button")}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <MdOutlineHelpOutline className="size-5" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={t("common:help.title")}
        className="max-w-[640px] p-5 lg:p-8"
        childrenClassName="space-y-5 py-2"
        footer={
          <Button size="sm" variant="primary" onClick={closeModal}>
            {t("common:help.close")}
          </Button>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("common:help.intro")}</p>
        {HELP_SECTION_KEYS.map((key) => (
          <section key={key} className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {t(`common:help.sections.${key}.title`)}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t(`common:help.sections.${key}.body`)}</p>
          </section>
        ))}
      </Modal>
    </>
  );
};

export default HelpButton;
