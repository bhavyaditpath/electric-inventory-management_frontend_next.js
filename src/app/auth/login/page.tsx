"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../../../types/enums";
import { tokenManager } from "@/Services/token.management.service";
import { authApi } from "@/Services/auth.api";
import { useAuth } from "@/contexts/AuthContext";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login({ username, password });

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
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-100">
      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-center px-20 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
        <h1 className="text-4xl font-bold mb-6">Electric Inventory</h1>
        <p className="text-blue-100 max-w-md">
          Manage inventory, purchases, alerts, and branch operations securely.
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            Sign in
          </h2>
          <p className="text-gray-500 mb-6">
            Enter your credentials to continue
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                className="w-full p-3 pl-5 rounded-lg bg-white border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                placeholder="Enter your username"
                
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3 pl-5 rounded-lg bg-white border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 text-gray-400 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-700 text-white
              font-semibold hover:bg-blue-800 transition disabled:opacity-50 cursor-pointer m-0"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleSignInButton />

          </form>
        </div>
      </div>
    </div>
  );
}
