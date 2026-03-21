import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { ENV_CONFIG } from "@/config/env";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title={`SignUp | ${ENV_CONFIG.APP_NAME}`}
        description={`This is SignUp page for ${ENV_CONFIG.APP_NAME}`}
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
