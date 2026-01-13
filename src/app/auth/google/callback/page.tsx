"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenManager } from "@/Services/token.management.service";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/enums";

function GoogleOAuthCallbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      console.log("Google auth failed:", error);
      return;
    }

    if (!accessToken) return;

    tokenManager.setTokens(accessToken, refreshToken || undefined);

    const decoded = tokenManager.decodeToken(accessToken);
    const user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      branchId: decoded.branchId,
    };

    login(accessToken, user);

    router.push(user.role === UserRole.ADMIN ? "/admin/dashboard" : "/branch/dashboard");
  }, [accessToken]);

  return <div>Processing Google Login...</div>;
}

export default function GoogleOAuthCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleOAuthCallbackForm />
    </Suspense>
  );
}
