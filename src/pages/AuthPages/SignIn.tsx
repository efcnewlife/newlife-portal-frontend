import { ENV_CONFIG } from "@/config/env";
import SignInForm from "../../components/auth/SignInForm";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title={`SignIn | ${ENV_CONFIG.APP_NAME}`}
        description={`This is SignIn page for ${ENV_CONFIG.APP_NAME}`}
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
