import { Button, Input } from "newlife-ui";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { authService } from "@/api/services/authService";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.requestPasswordReset(email);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(response.message || "An error occurred, please try again later");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred, please try again later";
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
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Email sent</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If the email address exists in our systems, we have sent a password reset link.
              Please check your inbox.
            </p>
          </div>
          <div>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => navigate("/signin")}
            >
              Return to login
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
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">forget the password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please enter your email address and we will send you a password reset link.
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  btnType="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Wait, I remember my password...
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

