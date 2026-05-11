import { userService } from "@/api/services/userService";
import { Checkbox, Input, TextArea } from "@efcnewlife/newlife-ui";
import { Gender } from "@/const/enums";
import { DateUtil } from "@/utils/dateUtil";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface UserDetailViewProps {
  userId: string;
}

interface UserDetailData {
  id: string;
  phone_number: string;
  email: string;
  verified: boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  last_login_at?: string;
  display_name?: string;
  gender?: Gender;
  is_ministry?: boolean;
  created_at?: string;
  updated_at?: string;
  remark?: string;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getById(userId);
        setUserData(response.data);
      } catch (e) {
        console.error("Error fetching user detail:", e);
        setError(t("system:user.detail.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      void fetchUserDetail();
    }
  }, [userId, t]);

  const getGenderText = (gender?: Gender) => {
    switch (gender) {
      case Gender.Male:
        return t("system:shared.genderMale");
      case Gender.Female:
        return t("system:shared.genderFemale");
      default:
        return t("system:shared.genderUnknown");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">{t("system:shared.loading")}</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500 dark:text-red-400">{error || t("system:shared.loadFailedShort")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input id="phone_number" label={t("system:user.table.phoneNumber")} type="text" value={userData.phone_number} disabled />
        </div>

        <div>
          <Input id="email" label={t("system:user.form.email.label")} type="email" value={userData.email} disabled />
        </div>

        <div>
          <Input
            id="display_name"
            label={t("system:user.form.displayName.label")}
            type="text"
            value={userData.display_name || t("system:shared.notSet")}
            disabled
          />
        </div>

        <div>
          <Input id="gender" label={t("system:user.form.gender.label")} type="text" value={getGenderText(userData.gender)} disabled />
        </div>
      </div>

      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:user.detail.sectionStatus")}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Checkbox id="verified" checked={userData.verified} disabled label={t("system:user.form.checkboxVerified")} />
        </div>
        <div>
          <Checkbox id="is_active" checked={userData.is_active} disabled label={t("system:user.detail.labelActiveStatus")} />
        </div>
        <div>
          <Checkbox id="is_admin" checked={userData.is_admin} disabled label={t("system:user.detail.labelBackendAdmin")} />
        </div>
        <div>
          <Checkbox id="is_superuser" checked={userData.is_superuser} disabled label={t("system:user.detail.labelSuperAdministrator")} />
        </div>
        <div>
          <Checkbox id="is_ministry" checked={userData.is_ministry ?? false} disabled label={t("system:user.detail.labelMinistryStaff")} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Input
            id="last_login_at"
            label={t("system:user.table.lastLoginAt")}
            type="text"
            value={userData.last_login_at ? DateUtil.format(userData.last_login_at) : t("system:shared.neverLoggedIn")}
            disabled
          />
        </div>

        <div>
          <Input
            id="created_at"
            label={t("system:user.table.createdAt")}
            type="text"
            value={userData.created_at ? DateUtil.format(userData.created_at) : t("system:shared.notSet")}
            disabled
          />
        </div>

        <div>
          <Input
            id="updated_at"
            label={t("system:user.detail.labelUpdatedAt")}
            type="text"
            value={userData.updated_at ? DateUtil.format(userData.updated_at) : t("system:shared.notSet")}
            disabled
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:user.detail.remarkHeading")}</label>
        <TextArea id="remark" placeholder="" value={userData.remark || ""} disabled rows={3} />
      </div>
    </div>
  );
};

export default UserDetailView;
