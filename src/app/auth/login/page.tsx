"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../../../types/enums";
import { tokenManager } from "@/Services/token.management.service";
import { authApi } from "@/Services/auth.api";
import { useAuth } from "@/contexts/AuthContext";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [focused, setFocused] = useState({ username: false, password: false });

  const router = useRouter();
  const { login } = useAuth();

  // Form validation
  const validateUsername = (value: string) => {
    if (!value.trim()) return "Username is required";
    if (value.trim().length < 3) return "Username must be at least 3 characters";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    return "";
  };

  const usernameError = touched.username ? validateUsername(username) : "";
  const passwordError = touched.password ? validatePassword(password) : "";
  const isFormValid = !usernameError && !passwordError && username.trim() && password;

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (!isFormValid) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login({ username: username.trim(), password });

      if (response.success && response.data?.access_token) {
        tokenManager.setToken(response.data.access_token);

        const decoded = tokenManager.decodeToken(response.data.access_token);
        if (!decoded) throw new Error("Invalid token");

        const userData = {
          id: decoded.sub || 0,
          username: decoded.username || "",
          role: (decoded.role as UserRole) || UserRole.BRANCH,
          branchId: decoded.branchId || 0,
        };

        login(response.data.access_token, userData);

        router.push(
          userData.role === UserRole.ADMIN
            ? "/admin/dashboard"
            : "/branch/dashboard"
        );
      } else {
        setError(response.message || "Invalid username or password");
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
            Professional Inventory Management
          </h2>
          
          <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-md">
            Streamline your electrical inventory operations with secure, efficient, and intelligent management tools.
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Real-time inventory tracking</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Secure branch management</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircleIcon className="w-5 h-5 mr-3 text-green-300" />
              <span>Advanced reporting & analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - LOGIN FORM */}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600">
                Sign in to access your dashboard
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocused({ ...focused, username: true })}
                    onBlur={() => setFocused({ ...focused, username: false })}
                    onBlurCapture={() => setTouched({ ...touched, username: true })}
                    className={`
                      w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200
                      focus:outline-none text-gray-900 placeholder-gray-500
                      ${usernameError 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : focused.username && !usernameError
                        ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      }
                    `}
                    placeholder="Enter your username"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                  {username && !usernameError && (
                    <CheckCircleIcon className="absolute right-3 top-3.5 w-5 h-5 text-green-500" />
                  )}
                </div>
                {usernameError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {usernameError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused({ ...focused, password: true })}
                    onBlur={() => setFocused({ ...focused, password: false })}
                    onBlurCapture={() => setTouched({ ...touched, password: true })}
                    className={`
                      w-full px-4 py-3.5 pr-12 rounded-xl border-2 transition-all duration-200
                      focus:outline-none text-gray-900 placeholder-gray-500
                      ${passwordError 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : focused.password && !passwordError
                        ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      }
                    `}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`
                  w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 m-0
                  ${isLoading || !isFormValid
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-sm text-gray-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <GoogleSignInButton />
            </form>

            {/* Security Notice */}
            <div className="pt-5">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-500" />
                <span>Secured with enterprise-grade encryption</span>
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
