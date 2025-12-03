"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/Services/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.forgotPassword({ username: email });
      if (response.success) {
        setMessage("Password reset link sent to your email!");
      } else {
        setError(response.message || "Failed to send reset link.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
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
            Forgot Password
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 text-green-700 border border-green-300 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>

            <div className="relative">
              <input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg bg-white border border-gray-600 
                focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter your registered email"
                disabled={isLoading}
              />

              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16 12H8m0 0l4-4m-4 4l4 4m-4-4h8" />
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
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

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
