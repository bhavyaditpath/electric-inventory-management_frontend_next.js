"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/Services/auth.api";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
        <div className="w-full flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
  const [focused, setFocused] = useState({ newPassword: false, confirmPassword: false });

  const router = useRouter();

  // Password validation
  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    // if (value.length < 8) return "Password must be at least 8 characters";
    // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    //   return "Password must contain uppercase, lowercase, and number";
    // }
    return "";
  };

  const newPasswordError = touched.newPassword ? validatePassword(newPassword) : "";
  const confirmPasswordError = touched.confirmPassword ?
    (confirmPassword ? (newPassword !== confirmPassword ? "Passwords do not match" : "") : "Please confirm your password") : "";

  const isFormValid = !newPasswordError && !confirmPasswordError && newPassword && confirmPassword;

  // useEffect(() => {
  //   if (error || message) {
  //     const timer = setTimeout(() => {
  //       setError("");
  //       setMessage("");
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error, message]);

  useEffect(() => {
    async function checkTokenValidity() {
      if (!token) {
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await authApi.validateResetToken({ token });

        if (response.success) {
          setIsTokenValid(true);
        } else {
          // If token validation fails, redirect to session expired page
          if (response.message && typeof response.message === 'string' && response.message.toLowerCase().includes("expired")) {
            router.push("/auth/session-expired");
            return;
          }
          // For other validation errors, show error message
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error("Token validation error:", err);
        // If there's an error during validation, redirect to session expired
        if (err instanceof Error && err.message.toLowerCase().includes("expired")) {
          router.push("/auth/session-expired");
          return;
        }
        setIsTokenValid(false);
      }
    }

    checkTokenValidity();
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });

    if (!isFormValid) return;

    setError("");
    setMessage("");

    if (!token) {
      setError("Token missing.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword,
      });

      if (response.success) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        setError(response.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking token
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
        <div className="w-full flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Validating reset token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If token is not valid, don't show anything - the useEffect will handle redirection
  if (isTokenValid === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* LEFT PANEL - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 px-16 text-white">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Electric Inventory</h1>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Secure Password Update
          </h2>

          <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-md">
            Create a strong new password to secure your inventory management account and protect your data.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Strong password requirements</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Secure token validation</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Protected account access</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - RESET PASSWORD FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Electric Inventory</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6">
                <LockClosedIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              <p className="text-gray-600">
                Create a strong new password for your account
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-green-700">{message}</div>
              </div>
            )}

            {!token ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">Invalid or missing reset token.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${focused.newPassword ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocused({ ...focused, newPassword: true })}
                      onBlur={() => setFocused({ ...focused, newPassword: false })}
                      onBlurCapture={() => setTouched({ ...touched, newPassword: true })}
                      className={`
                        w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-200
                        focus:outline-none text-gray-900 placeholder-gray-500
                        ${newPasswordError
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : focused.newPassword && !newPasswordError
                            ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                        }
                      `}
                      placeholder="Enter new password"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    {newPassword && !newPasswordError && (
                      <div className="absolute inset-y-0 right-12 flex items-center pr-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {newPasswordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {newPasswordError}
                    </p>
                  )}
                  {!newPasswordError && newPassword && (
                    <p className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Strong password
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${focused.confirmPassword ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused({ ...focused, confirmPassword: true })}
                      onBlur={() => setFocused({ ...focused, confirmPassword: false })}
                      onBlurCapture={() => setTouched({ ...touched, confirmPassword: true })}
                      className={`
                        w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-200
                        focus:outline-none text-gray-900 placeholder-gray-500
                        ${confirmPasswordError
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : focused.confirmPassword && !confirmPasswordError
                            ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                        }
                      `}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    {confirmPassword && !confirmPasswordError && newPassword === confirmPassword && (
                      <div className="absolute inset-y-0 right-12 flex items-center pr-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {confirmPasswordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                      {confirmPasswordError}
                    </p>
                  )}
                  {!confirmPasswordError && confirmPassword && newPassword === confirmPassword && (
                    <p className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className={`
                    w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200
                    ${isLoading || !isFormValid
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating Password...
                    </div>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            )}

            {/* Back to Login */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-center">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Login
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-500" />
                <span>Your password is encrypted and secure</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>© 2024 Electric Inventory Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
