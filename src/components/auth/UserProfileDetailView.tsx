import { userService, type UserUpdate } from "@/api/services/userService";
import { Button, Checkbox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";
import { Gender } from "@/const/enums";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

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

interface UserProfileDetailViewProps {
  isEditing: boolean;
  onEditChange?: (editing: boolean) => void;
}

const UserProfileDetailView: React.FC<UserProfileDetailViewProps> = ({ isEditing, onEditChange }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [formData, setFormData] = useState<UserUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getCurrentUser();
        if (response.success && response.data) {
          setUserData(response.data);
          // Initialize form data
          setFormData({
            phone_number: response.data.phone_number,
            email: response.data.email,
            display_name: response.data.display_name || "",
            gender: response.data.gender ?? Gender.Unknown,
            remark: response.data.remark || "",
          });
        } else {
          setError("Failed to load user details");
        }
      } catch (e) {
        console.error("Error fetching user detail:", e);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, []);

  // Reset form data when editing is canceled
  useEffect(() => {
    if (!isEditing && userData) {
      setFormData({
        phone_number: userData.phone_number,
        email: userData.email,
        display_name: userData.display_name || "",
        gender: userData.gender ?? Gender.Unknown,
        remark: userData.remark || "",
      });
      setError(null);
    }
  }, [isEditing, userData]);

  const handleSave = async () => {
    if (!user?.id || !formData) {
      setError("Unable to get user information");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await userService.updateCurrentUser(formData);
      // Reload data
      const response = await userService.getCurrentUser();
      if (response.success && response.data) {
        setUserData(response.data);
        onEditChange?.(false);
      }
    } catch (e) {
      console.error("Error updating user:", e);
      setError("Update failed. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        phone_number: userData.phone_number,
        email: userData.email,
        display_name: userData.display_name || "",
        gender: userData.gender ?? Gender.Unknown,
        remark: userData.remark || "",
      });
    }
    setError(null);
    onEditChange?.(false);
  };

  const getGenderText = (gender?: number) => {
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

  if (!formData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Basic information */}
      <div className="space-y-6">
        <div>
          <Input
            id="phone_number"
            label="Phone Number"
            type="text"
            value={isEditing ? formData.phone_number : userData.phone_number}
            onChange={(e) => isEditing && setFormData((f) => (f ? { ...f, phone_number: e.target.value } : null))}
            disabled={!isEditing}
          />
        </div>

        <div>
          <Input
            id="email"
            label="Email"
            type="email"
            value={isEditing ? formData.email : userData.email}
            onChange={(e) => isEditing && setFormData((f) => (f ? { ...f, email: e.target.value } : null))}
            disabled={!isEditing}
          />
        </div>

        <div>
          <Input
            id="display_name"
            label="Display Name"
            type="text"
            value={isEditing ? formData.display_name || "" : userData.display_name || "Not set"}
            onChange={(e) => isEditing && setFormData((f) => (f ? { ...f, display_name: e.target.value } : null))}
            disabled={!isEditing}
          />
        </div>

        <div>
          {isEditing ? (
            <Select
              id="gender"
              label="Gender"
              options={[
                { value: Gender.Unknown, label: "Unknown" },
                { value: Gender.Male, label: "Male" },
                { value: Gender.Female, label: "Female" },
              ]}
              value={formData.gender ?? Gender.Unknown}
              onChange={(value) => {
                if (typeof value === "number" || typeof value === "string") {
                  setFormData((f) => (f ? { ...f, gender: Number(value) } : null));
                }
              }}
              placeholder="Select gender"
            />
          ) : (
            <Input id="gender" label="Gender" type="text" value={getGenderText(userData.gender)} disabled />
          )}
        </div>
      </div>

      {/* Status information */}
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status/Permissions</div>
      <div className="space-y-4">
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

      {/* Remark */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remark</label>
        <TextArea
          id="remark"
          placeholder=""
          value={isEditing ? formData.remark || "" : userData.remark || ""}
          onChange={(value) => isEditing && setFormData((f) => (f ? { ...f, remark: value } : null))}
          disabled={!isEditing}
          rows={3}
        />
      </div>

      {/* Error message */}
      {error && <div className="p-3 text-sm text-red-800 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      {/* Save and cancel buttons */}
      {isEditing && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="primary" size="md" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" size="md" onClick={handleCancel} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDetailView;
