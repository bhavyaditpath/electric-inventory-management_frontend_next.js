"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../../../types/enums";
import { tokenManager } from "@/Services/token.management.service";
import { authApi } from "@/Services/auth.api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        if (decoded) {
          const userData = {
            id: decoded.sub || 0,
            username: decoded.username || '',
            role: (decoded.role as UserRole) || UserRole.BRANCH,
            branchId: decoded.branchId || 0,
          };
          login(response.data.access_token, userData);

          if (userData.role === UserRole.ADMIN) {
            router.push("/admin/dashboard");
          } else if (userData.role === UserRole.BRANCH) {
            router.push("/branch/dashboard");
          } else {
            setError("Invalid user role");
            tokenManager.removeToken();
          }
        } else {
          setError("Invalid token");
          tokenManager.removeToken();
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="backdrop-blur-xl bg-white/80 border border-gray-200 p-10 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Logo + Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-wide">
            Electric Inventory
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg bg-white border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M5.121 17.804A4 4 0 018.999 16h6a4 4 0 013.878 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-lg bg-white border border-gray-300 
                focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your password"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
            transition font-semibold text-white shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-30" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-80" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z">
                  </path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Electric Inventory Management System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
