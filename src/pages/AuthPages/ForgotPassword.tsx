import { ENV_CONFIG } from "@/config/env";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function ForgotPassword() {
  return (
    <>
      <PageMeta
        title={`Forgot Password | ${ENV_CONFIG.APP_NAME}`}
        description={`This is Forgot Password page for ${ENV_CONFIG.APP_NAME}`}
      />
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
