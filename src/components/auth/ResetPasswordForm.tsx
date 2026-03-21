import { authService } from "@/api/services/authService";
import { Button, Input } from "newlife-ui";
import { useEffect, useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Link, useNavigate, useSearchParams } from "react-router";

interface PasswordValidationStatus {
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMinLength: boolean;
}

const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: "Password length needs to be at least 8 characters" };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, message: "Password needs to contain at least one special character (!@#$%^&* wait)" };
  }

  return { isValid: true, message: "" };
};

const getPasswordValidationStatus = (password: string): PasswordValidationStatus => {
  return {
    hasLowerCase: /[a-z]/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    hasMinLength: password.length >= 8,
  };
};

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordValidationStatus = getPasswordValidationStatus(newPassword);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link, missing token parameter");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError("The passwords entered twice are inconsistent");
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPasswordWithToken(token, newPassword, newPasswordConfirm);
      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      } else {
        setError(response.message || "Password reset failed, please try again later");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Password reset failed, please try again later";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col flex-1 w-full lg:w-1/2">
        <div className="w-full max-w-md pt-10 mx-auto">
          <Link
            to="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg className="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Password reset successful</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your password has been successfully reset. It will automatically jump to the login page in 3 seconds.</p>
          </div>
          <div>
            <Button variant="primary" size="md" className="w-full" onClick={() => navigate("/signin")}>
              Log in now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg className="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">reset password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{email ? `please for ${email} Enter your new password` : "Please enter your new password"}</p>
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Input
                  id="newPassword"
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  icon={
                    showPassword ? (
                      <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )
                  }
                  iconPosition="right"
                  iconClick={() => setShowPassword(!showPassword)}
                  placeholder="Please enter a password that meets the strength requirements"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div
                      className={`text-xs flex items-center ${
                        passwordValidationStatus.hasMinLength ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`mr-2 ${passwordValidationStatus.hasMinLength ? "text-green-600 dark:text-green-400" : ""}`}>
                        {passwordValidationStatus.hasMinLength ? "✓" : "✗"}
                      </span>
                      Longer than 8 characters
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        passwordValidationStatus.hasLowerCase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`mr-2 ${passwordValidationStatus.hasLowerCase ? "text-green-600 dark:text-green-400" : ""}`}>
                        {passwordValidationStatus.hasLowerCase ? "✓" : "✗"}
                      </span>
                      at least one lowercase letter
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        passwordValidationStatus.hasUpperCase ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`mr-2 ${passwordValidationStatus.hasUpperCase ? "text-green-600 dark:text-green-400" : ""}`}>
                        {passwordValidationStatus.hasUpperCase ? "✓" : "✗"}
                      </span>
                      at least one capital letter
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        passwordValidationStatus.hasNumber ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`mr-2 ${passwordValidationStatus.hasNumber ? "text-green-600 dark:text-green-400" : ""}`}>
                        {passwordValidationStatus.hasNumber ? "✓" : "✗"}
                      </span>
                      at least one number
                    </div>
                    <div
                      className={`text-xs flex items-center ${
                        passwordValidationStatus.hasSpecialChar ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`mr-2 ${passwordValidationStatus.hasSpecialChar ? "text-green-600 dark:text-green-400" : ""}`}>
                        {passwordValidationStatus.hasSpecialChar ? "✓" : "✗"}
                      </span>
                      At least one special character (!@#$%^&* wait)
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Input
                  id="newPasswordConfirm"
                  label="Confirm new password"
                  type={showPasswordConfirm ? "text" : "password"}
                  icon={
                    showPasswordConfirm ? (
                      <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )
                  }
                  iconPosition="right"
                  iconClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  placeholder="Enter new password again"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  min={8}
                />
              </div>

              {error && <div className="p-3 text-sm text-red-800 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">{error}</div>}

              <div>
                <Button variant="primary" size="md" className="w-full" btnType="submit" disabled={isLoading || !token}>
                  {isLoading ? "Resetting..." : "reset password"}
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Remember your password?
              <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Click here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
