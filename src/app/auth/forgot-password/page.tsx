"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/Services/auth.api";
import { 
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false });
  const [focused, setFocused] = useState({ email: false });

  const router = useRouter();

  // Email validation
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return "Email address is required";
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const emailError = touched.email ? validateEmail(email) : "";
  const isFormValid = !emailError && email.trim();

  useEffect(() => {
    if (error || message) {
      const timer = setTimeout(() => {
        setError("");
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true });

    if (!isFormValid) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.forgotPassword({ username: email });
      if (response.success) {
        setMessage("Password reset link sent to your email! Please check your inbox.");
      } else {
        setError(response.message || "Failed to send reset link. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
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
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Electric Inventory</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Secure Password Recovery
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-md">
            Don't worry! We'll help you regain access to your inventory management system securely and quickly.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Secure email verification</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Instant password reset</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Protected account access</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - FORGOT PASSWORD FORM */}
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6">
                <EnvelopeIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600">
                Enter your email address and we'll send you a secure reset link
              </p>
            </div>

            {/* Success/Error Messages */}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className={`h-5 w-5 transition-colors duration-200 ${
                      focused.email ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused({ ...focused, email: true })}
                    onBlur={() => setFocused({ ...focused, email: false })}
                    onBlurCapture={() => setTouched({ ...touched, email: true })}
                    className={`
                      w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200
                      focus:outline-none text-gray-900 placeholder-gray-500
                      ${emailError 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : focused.email && !emailError
                        ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      }
                    `}
                    placeholder="Enter your registered email"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {email && !emailError && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {emailError}
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
                    Sending Reset Link...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

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
                <span>Your account security is our priority</span>
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
