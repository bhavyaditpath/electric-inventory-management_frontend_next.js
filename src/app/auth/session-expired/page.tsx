"use client";

import { useRouter } from "next/navigation";

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="backdrop-blur-xl bg-white/80 border border-gray-200 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide">
            Session Expired
          </h1>

          <p className="text-gray-500 mt-4 text-lg">
            Your password reset link has expired or is invalid.
          </p>
        </div>

        {/* Expired Icon */}
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <p className="text-gray-600">
            For security reasons, password reset links are only valid for a limited time.
          </p>
          <p className="text-gray-600 mt-2">
            Please request a new password reset link to continue.
          </p>
        </div>

        {/* Request New Link Button */}
        <button
          onClick={() => router.push("/auth/forgot-password")}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
          transition font-semibold text-white shadow-lg hover:shadow-xl"
        >
          Request New Reset Link
        </button>

        {/* Back to Login */}
        <div className="mt-6">
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