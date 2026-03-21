import { userService } from "@/api/services/userService";
import { Checkbox, Input, TextArea } from "newlife-ui";
import { Gender } from "@/const/enums";
import { DateUtil } from "@/utils/dateUtil";
import { useEffect, useState } from "react";

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
  created_at?: string;
  updated_at?: string;
  remark?: string;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ userId }) => {
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
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const getGenderText = (gender?: Gender) => {
    switch (gender) {
      case Gender.Male:
        return "Male";
      case Gender.Female:
        return "Female";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-500 dark:text-red-400">{error || "Load failed"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input id="phone_number" label="Phone Number" type="text" value={userData.phone_number} disabled />
        </div>

        <div>
          <Input id="email" label="Email" type="email" value={userData.email} disabled />
        </div>

        <div>
          <Input id="display_name" label="Display Name" type="text" value={userData.display_name || "Not set"} disabled />
        </div>

        <div>
          <Input id="gender" label="Gender" type="text" value={getGenderText(userData.gender)} disabled />
        </div>
      </div>

      {/* Status */}
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status / Permissions</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Checkbox id="verified" checked={userData.verified} disabled label="Verified" />
        </div>
        <div>
          <Checkbox id="is_active" checked={userData.is_active} disabled label="Active" />
        </div>
        <div>
          <Checkbox id="is_admin" checked={userData.is_admin} disabled label="Admin" />
        </div>
        <div>
          <Checkbox id="is_superuser" checked={userData.is_superuser} disabled label="Superuser" />
        </div>
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Input
            id="last_login_at"
            label="Last Login"
            type="text"
            value={userData.last_login_at ? DateUtil.format(userData.last_login_at) : "Never logged in"}
            disabled
          />
        </div>

        <div>
          <Input
            id="created_at"
            label="Created At"
            type="text"
            value={userData.created_at ? DateUtil.format(userData.created_at) : "Unknown"}
            disabled
          />
        </div>

        <div>
          <Input
            id="updated_at"
            label="Updated At"
            type="text"
            value={userData.updated_at ? DateUtil.format(userData.updated_at) : "Unknown"}
            disabled
          />
        </div>
      </div>

      {/* Remark */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remark</label>
        <TextArea id="remark" placeholder="" value={userData.remark || ""} disabled rows={3} />
      </div>
    </div>
  );
};

export default UserDetailView;
