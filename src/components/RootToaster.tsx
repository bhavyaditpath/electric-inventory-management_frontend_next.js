"use client";

import { Toaster } from "react-hot-toast";

export function RootToaster() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{ zIndex: 99999 }}
      toastOptions={{
        duration: 1000,
        style: {
          background: '#363636',
          color: '#fff',
          zIndex: 99999,
        },
        success: {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
            zIndex: 99999,
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
            zIndex: 99999,
          },
        },
      }}
    />
  );
}
