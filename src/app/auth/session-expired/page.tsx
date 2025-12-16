"use client";

import { useRouter } from "next/navigation";
import { 
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function SessionExpiredPage() {
  const router = useRouter();

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
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Electric Inventory</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Session Security
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-md">
            Your session has expired for security purposes. This ensures your account remains protected at all times.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <ShieldCheckIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Automatic security timeout</span>
            </div>
            <div className="flex items-center text-blue-100">
              <ShieldCheckIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Protected session management</span>
            </div>
            <div className="flex items-center text-blue-100">
              <ShieldCheckIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Secure account access</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - SESSION EXPIRED MESSAGE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Electric Inventory</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Session Expired
              </h2>
              <p className="text-gray-600">
                Your session has expired for security reasons
              </p>
            </div>

            {/* Message */}
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 leading-relaxed">
                For security purposes, password reset links are only valid for a limited time. 
                Your current session has expired to protect your account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Request New Reset Link
              </button>

              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all duration-200 flex items-center justify-center"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Login
              </button>
            </div>

            {/* Security Notice */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-500" />
                <span>Your security is our top priority</span>
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