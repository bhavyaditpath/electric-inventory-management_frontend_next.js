"use client";

import { useEffect } from "react";

interface ChatLightboxProps {
  lightbox: { url: string; name: string } | null;
  onClose: () => void;
}

export default function ChatLightbox({ lightbox, onClose }: ChatLightboxProps) {
  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox, onClose]);

  if (!lightbox) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-4xl w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-white truncate">{lightbox.name}</p>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
            aria-label="Close preview"
          >
            x
          </button>
        </div>
        <div className="bg-black/40 rounded-lg overflow-hidden">
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="w-full max-h-[75vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
