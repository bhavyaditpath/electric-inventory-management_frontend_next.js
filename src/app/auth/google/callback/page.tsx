"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/enums';
import { tokenManager } from '@/Services/token.management.service';

export default function GoogleOAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        if (state !== 'google-oauth-state') {
          setStatus('error');
          setMessage('Invalid state parameter');
          return;
        }

        // Send the authorization code to backend (direct call to avoid auth header)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log('Sending code to backend:', `${API_BASE_URL}/auth/google/callback`, { code });

        const backendResponse = await fetch(`${API_BASE_URL}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        console.log('Backend response status:', backendResponse.status);
        console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

        if (!backendResponse.ok) {
          const errorText = await backendResponse.text();
          console.error('Backend error response:', errorText);
          throw new Error(`Backend authentication failed (${backendResponse.status}): ${errorText}`);
        }

        const data = await backendResponse.json();

        if (data.success && data.access_token) {
          // Store tokens securely
          tokenManager.setAccessToken(data.access_token);
          if (data.refresh_token) {
            tokenManager.setRefreshToken(data.refresh_token);
          }

          // Decode and set user
          const decoded = tokenManager.decodeToken(data.access_token);
          if (!decoded) {
            throw new Error('Invalid token received');
          }

          const userData = {
            id: decoded.sub || decoded.id || 0,
            username: decoded.email || decoded.username || '',
            role: (decoded.role as UserRole) || UserRole.BRANCH,
            branchId: decoded.branchId || 0,
          };

          login(data.access_token, userData);

          setStatus('success');
          setMessage('Successfully signed in with Google!');

          // Redirect based on role
          setTimeout(() => {
            if (userData.role === UserRole.ADMIN) {
              router.push('/admin/dashboard');
            } else if (userData.role === UserRole.BRANCH) {
              router.push('/branch/dashboard');
            } else {
              router.push('/auth/login');
            }
          }, 2000);
        } else {
          throw new Error(data.message || 'Authentication failed');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="backdrop-blur-xl bg-white/80 border border-gray-200 p-10 rounded-2xl shadow-2xl w-full max-w-md text-center">

        {status === 'loading' && (
          <>
            <div className="mb-6">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg"
                   fill="none" viewBox="0 0 24 24">
                <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-80" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Signing you in...</h1>
            <p className="text-gray-600">Please wait while we complete your Google authentication.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <svg className="h-12 w-12 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <svg className="h-12 w-12 text-red-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700
                         transition font-semibold text-white shadow-lg hover:shadow-xl"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}