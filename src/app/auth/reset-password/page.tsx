"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/Services/auth.api";
import { LockClosedIcon, EyeIcon, EyeSlashIcon, } from "@heroicons/react/24/outline";


export default function ResetPasswordPage() {
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

  const router = useRouter();

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

    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

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
        setError(response.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking token
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="backdrop-blur-xl bg-white/80 border border-gray-200 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset token...</p>
        </div>
      </div>
    );
  }

  // If token is not valid, don't show anything - the useEffect will handle redirection
  if (isTokenValid === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="backdrop-blur-xl bg-white/80 border border-gray-200 p-10 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide">
            Reset Password
          </h1>

          <p className="text-gray-500 mt-2 text-lg">
            Enter a new password for your account.
          </p>
        </div>

        {/* No Token Error */}
        {!token ? (
          <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-md text-sm mb-4">
            Invalid or missing reset token.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-lg bg-white border border-gray-300
      focus:outline-none text-gray-700"
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                />

                {/* Lock Icon */}
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <LockClosedIcon className="w-5 h-5" />
                </span>

                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-lg bg-white border border-gray-300
      focus:outline-none text-gray-700"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />

                {/* Lock Icon */}
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <LockClosedIcon className="w-5 h-5" />
                </span>

                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
              transition font-semibold text-white shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Change Password"}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/auth/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}
