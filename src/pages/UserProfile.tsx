import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import UserProfileDetailView from "@/components/auth/UserProfileDetailView";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button";
import { ENV_CONFIG } from "@/config/env";
import { useState } from "react";
import { MdEdit } from "react-icons/md";

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <PageMeta title={`User Profile | ${ENV_CONFIG.APP_NAME}`} description={`This is User Profile page for ${ENV_CONFIG.APP_NAME}`} />
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* personal information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex items-center justify-between mb-5 lg:mb-7">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">personal information</h3>
            {!isEditing && (
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <MdEdit size={18} />
                Modify information
              </Button>
            )}
          </div>
          <UserProfileDetailView isEditing={isEditing} onEditChange={setIsEditing} />
        </div>

        {/* Change password */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
