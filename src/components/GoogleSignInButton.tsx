"use client";

export default function GoogleSignInButton() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="
        w-full flex items-center justify-center gap-3 
        py-3 px-4 rounded-lg 
        bg-white border border-gray-300 
        hover:bg-gray-50 active:bg-gray-100
        transition-all duration-200 
        shadow-sm hover:shadow-md
        font-medium text-gray-700
      "
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.53 13.08 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.56-.14-3.06-.41-4.5H24v9h12.85c-.56 3.01-2.23 5.56-4.73 7.28l7.39 5.77C43.57 37.65 46.5 31.51 46.5 24.5z"/>
        <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 019.5 24c0-1.59.26-3.12.72-4.59L2.56 13.22A23.889 23.889 0 000 24c0 3.87.92 7.53 2.56 10.78l7.98-6.19z"/>
        <path fill="#34A853" d="M24 48c6.47 0 11.9-2.38 16.06-6.46l-7.39-5.77c-2.07 1.41-4.72 2.23-8.67 2.23-6.26 0-11.47-3.58-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>

      <span>Continue with Google</span>
    </button>
  );
}