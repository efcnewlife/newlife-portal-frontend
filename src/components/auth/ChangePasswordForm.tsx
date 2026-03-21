import { httpClient } from "@/api";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function ChangePasswordForm() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== newPasswordConfirm) {
      setError("The new passwords entered twice are inconsistent");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (oldPassword === newPassword) {
      setError("The new password cannot be the same as the old password");
      return;
    }

    if (!user?.id) {
      setError("Unable to obtain user information, please log in again");
      return;
    }

    setIsLoading(true);

    try {
      const response = await httpClient.post<{ message: string }>(`/api/v1/admin/user/${user.id}/change_password`, {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });

      if (response.success) {
        setIsSuccess(true);
        // Clear form
        setOldPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
        // 3 Reset the success status after seconds and hide the form
        setTimeout(() => {
          setIsSuccess(false);
          setShowForm(false);
        }, 3000);
      } else {
        setError(response.message || "Failed to change password, please try again later");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to change password, please try again later";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Change password</h3>
          {!showForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowForm(true);
                setError(null);
                setIsSuccess(false);
              }}
            >
              Change password
            </Button>
          )}
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <Input
                id="oldPassword"
                label="Old Password"
                type={showOldPassword ? "text" : "password"}
                icon={
                  showOldPassword ? (
                    <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )
                }
                iconPosition="right"
                iconClick={() => setShowOldPassword(!showOldPassword)}
                placeholder="Please enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                id="newPassword"
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                icon={
                  showNewPassword ? (
                    <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )
                }
                iconPosition="right"
                iconClick={() => setShowNewPassword(!showNewPassword)}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                min={8}
              />
            </div>

            <div>
              <Input
                id="newPasswordConfirm"
                label="Confirm new password"
                type={showNewPasswordConfirm ? "text" : "password"}
                icon={
                  showNewPasswordConfirm ? (
                    <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )
                }
                iconPosition="right"
                iconClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                placeholder="Enter new password again"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                required
                min={8}
              />
            </div>

            {error && <div className="p-3 text-sm text-red-800 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">{error}</div>}

            {isSuccess && (
              <div className="p-3 text-sm text-green-800 bg-green-50 rounded-md dark:bg-green-900/20 dark:text-green-400">
                Password changed successfully!
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" btnType="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Under modification..." : "Confirm changes"}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowForm(false);
                  setOldPassword("");
                  setNewPassword("");
                  setNewPasswordConfirm("");
                  setError(null);
                  setIsSuccess(false);
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
