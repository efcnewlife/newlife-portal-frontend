import { Button, Checkbox, Input } from "newlife-ui";
import { ENV_CONFIG } from "@/config/env";
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
  const { login, isLoading, error, isAuthenticated } = useAuth();

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
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("auth.signInPrompt")}</p>
            {ENV_CONFIG.USE_MOCK_AUTH && (
              <div className="mt-3 rounded-lg border border-brand-300/40 bg-brand-50/50 px-3 py-2 text-xs text-brand-700 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
                Mock login: {ENV_CONFIG.MOCK_AUTH_EMAIL} / {ENV_CONFIG.MOCK_AUTH_PASSWORD}
              </div>
            )}
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Input
                    id="email"
                    label={t("auth.email")}
                    type="email"
                    placeholder="info@gmail.com"
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
                <div className="flex items-center justify-between">
                  <Checkbox checked={isChecked} onChange={setIsChecked} label={t("auth.keepMeLoggedIn")} />
                  <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                {error && <p className="text-sm text-error-500">{error}</p>}
                <div>
                  <Button btnType="submit" className="w-full" size="sm" disabled={isLoading || !isFormValid}>
                    {isLoading ? t("auth.signingIn") : t("auth.signIn")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
