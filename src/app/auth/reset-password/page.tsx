"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/Services/auth.api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

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
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-white border border-gray-300 
                  focus:outline-none text-gray-700"
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                />

                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.944 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.944-9.542-7z" />
                  </svg>
                </span>
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
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg bg-white border border-gray-300 
                  focus:outline-none text-gray-700"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />

                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.944 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.944-9.542-7z" />
                  </svg>
                </span>
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
