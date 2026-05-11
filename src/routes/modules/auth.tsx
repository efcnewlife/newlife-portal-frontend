import { MdLock } from "react-icons/md";
import ResetPassword from "../../pages/AuthPages/ResetPassword";
import ForgotPassword from "../../pages/AuthPages/ForgotPassword";
import SignIn from "../../pages/AuthPages/SignIn";
import TwoStepVerification from "../../pages/AuthPages/TwoStepVerification";
import { ModuleRoute } from "../../types/route";

export const authRoutes: ModuleRoute = {
  module: "auth",
  meta: {
    title: "Authentication",
    description: "Authentication related pages",
    icon: <MdLock />,
    order: 0,
  },
  routes: [
    {
      path: "/signin",
      element: <SignIn />,
      meta: {
        title: "Sign In",
        description: "User sign in page",
        requiresAuth: false,
        breadcrumb: ["Authentication", "Sign In"],
      },
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
      meta: {
        title: "Forgot Password",
        description: "Forgot password page",
        requiresAuth: false,
        breadcrumb: ["Authentication", "Forgot Password"],
      },
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
      meta: {
        title: "Reset Password",
        description: "Password reset page",
        requiresAuth: false,
        breadcrumb: ["Authentication", "Reset Password"],
      },
    },
    {
      path: "/two-step-verification",
      element: <TwoStepVerification />,
      meta: {
        title: "Two Step Verification",
        description: "Two factor authentication page",
        requiresAuth: false,
        breadcrumb: ["Authentication", "Two Step Verification"],
      },
    },
  ],
};
