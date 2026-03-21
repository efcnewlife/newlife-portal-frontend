import { ENV_CONFIG } from "@/config/env";
import OtpForm from "../../components/auth/OtpForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function TwoStepVerification() {
  return (
    <>
      <PageMeta
        title={`Two Step Verification | ${ENV_CONFIG.APP_NAME}`}
        description={`This is Two Step Verification page for ${ENV_CONFIG.APP_NAME}`}
      />
      <AuthLayout>
        <OtpForm />
      </AuthLayout>
    </>
  );
}
