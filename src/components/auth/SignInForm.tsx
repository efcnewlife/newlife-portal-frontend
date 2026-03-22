import { MicrosoftColorIcon } from "@/assets/icons";
import { ENV_CONFIG, IS_SHOW_DEV_LOGIN } from "@/config/env";
import { Button, Checkbox, Input } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithMicrosoft, isLoading, error, isAuthenticated } = useAuth();

  // Validate whether form input is valid
  const isFormValid = useMemo(() => {
    // Check if email is non-empty and valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = email.trim().length > 0 && emailRegex.test(email.trim());

    // Check if password is non-empty
    const isValidPassword = password.trim().length > 0;

    return isValidEmail && isValidPassword;
  }, [email, password]);

  // Redirect to home page if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password, rememberMe: isChecked });
      navigate("/");
    } catch (err) {
      // Errors are shown through Context state
      console.error(err);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      await loginWithMicrosoft(isChecked);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <div className="flex flex-col items-center mb-6">
              <img src="/images/logo/logo.png" alt="Logo" className="mb-4 w-50 h-50 rounded-2xl" />
              <h1 className="text-gray-600 dark:text-gray-300 font-semibold text-2xl">{ENV_CONFIG.APP_NAME}</h1>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">{t("auth.signIn")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("auth.signInPromptMicrosoft")}</p>
          </div>
          <div>
            <div className="space-y-6">
              {error && <p className="text-sm text-error-500">{error}</p>}
              <div>
                <Button
                  btnType="button"
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={isLoading}
                  onClick={handleMicrosoftSignIn}
                  startIcon={<MicrosoftColorIcon className="size-[22px] shrink-0" aria-hidden focusable={false} />}
                >
                  {isLoading ? t("auth.microsoftSigningIn") : t("auth.signInWithMicrosoft")}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Checkbox checked={isChecked} onChange={setIsChecked} label={t("auth.keepMeLoggedIn")} />
              </div>
              {IS_SHOW_DEV_LOGIN && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        {t("auth.devEmailSignInSection")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("auth.signInPromptDev")}</p>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <Input
                          id="email"
                          label={t("auth.email")}
                          type="email"
                          placeholder="info@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          id="password"
                          label={t("auth.password")}
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
                          placeholder={t("auth.password")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                          {t("auth.forgotPassword")}
                        </Link>
                      </div>
                      <div>
                        <Button btnType="submit" className="w-full" size="sm" disabled={isLoading || !isFormValid}>
                          {isLoading ? t("auth.signingIn") : t("auth.signInWithEmail")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
