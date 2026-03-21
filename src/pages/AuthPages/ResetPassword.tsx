import { ENV_CONFIG } from "@/config/env";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function ResetPassword() {
  return (
    <>
      <PageMeta title={`Reset Password | ${ENV_CONFIG.APP_NAME}`} description={`This is Reset Password page for ${ENV_CONFIG.APP_NAME}`} />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
