"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  deriveRoomKey,
  generateEncryptionKey,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
} from "@/utils/chatEncryption";

const STORAGE_KEY = "chat_encryption_master_key";
const ENCRYPTION_ENABLED_KEY = "chat_encryption_enabled";
const ROOM_KEYS_PREFIX = "chat_room_key_";

interface ChatEncryptionContextType {
  isEnabled: boolean;
  setEncryptionEnabled: (enabled: boolean) => void;
  getRoomKey: (roomId: number) => string | null;
  initializeRoomKey: (roomId: number) => Promise<void>;
  encrypt: (plaintext: string, roomId: number) => Promise<string>;
  decrypt: (encryptedContent: string, roomId: number) => Promise<string>;
  isInitialized: boolean;
  isRoomEncrypted: (roomId: number) => boolean;
}

const ChatEncryptionContext = createContext<ChatEncryptionContextType | undefined>(
  undefined
);

interface ChatEncryptionProviderProps {
  children: React.ReactNode;
}

export function ChatEncryptionProvider({ children }: ChatEncryptionProviderProps) {
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [roomKeys, setRoomKeys] = useState<Record<number, string>>({});
  const [isEnabled, setIsEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load master key and settings from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMasterKey = localStorage.getItem(STORAGE_KEY);
    const storedEnabled = localStorage.getItem(ENCRYPTION_ENABLED_KEY);

    if (storedMasterKey) {
      setMasterKey(storedMasterKey);
      // Load existing room keys
      const keys: Record<number, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(ROOM_KEYS_PREFIX)) {
          const roomId = parseInt(key.replace(ROOM_KEYS_PREFIX, ""), 10);
          const roomKey = localStorage.getItem(key);
          if (roomKey && !isNaN(roomId)) {
            keys[roomId] = roomKey;
          }
        }
      }
      setRoomKeys(keys);
    }

    if (storedEnabled !== null) {
      setIsEnabled(storedEnabled === "true");
    }

    setIsInitialized(true);
  }, []);

  const setEncryptionEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(ENCRYPTION_ENABLED_KEY, String(enabled));
    }
  }, []);

  const initializeRoomKey = useCallback(
    async (roomId: number) => {
      let keyToUse = masterKey;

      if (!keyToUse) {
        // Generate new master key if none exists
        const newMasterKey = await generateEncryptionKey();
        setMasterKey(newMasterKey);
        keyToUse = newMasterKey;
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, newMasterKey);
        }
      }

      // Derive room-specific key
      const roomKey = await deriveRoomKey(keyToUse, roomId);

      setRoomKeys((prev) => ({ ...prev, [roomId]: roomKey }));
      if (typeof window !== "undefined") {
        localStorage.setItem(`${ROOM_KEYS_PREFIX}${roomId}`, roomKey);
      }
    },
    [masterKey]
  );

  const getRoomKey = useCallback(
    (roomId: number): string | null => {
      return roomKeys[roomId] || null;
    },
    [roomKeys]
  );

  const isRoomEncrypted = useCallback(
    (roomId: number): boolean => {
      return !!roomKeys[roomId];
    },
    [roomKeys]
  );

  const encrypt = useCallback(
    async (plaintext: string, roomId: number): Promise<string> => {
      if (!isEnabled) {
        return plaintext;
      }

      let roomKey = roomKeys[roomId];

      if (!roomKey) {
        await initializeRoomKey(roomId);
        // Get the newly created key from state
        roomKey = roomKeys[roomId];

        // If still not available, try localStorage
        if (!roomKey && typeof window !== "undefined") {
          const stored = localStorage.getItem(`${ROOM_KEYS_PREFIX}${roomId}`);
          if (stored) {
            roomKey = stored;
          }
        }
      }

      if (!roomKey) {
        console.error("No encryption key available for room", roomId);
        return plaintext;
      }

      try {
        return await encryptMessage(plaintext, roomKey);
      } catch (error) {
        console.error("Encryption failed:", error);
        return plaintext;
      }
    },
    [isEnabled, roomKeys, initializeRoomKey]
  );

  const decrypt = useCallback(
    async (encryptedContent: string, roomId: number): Promise<string> => {
      if (!isEnabled) {
        return encryptedContent;
      }

      // Skip decryption if content doesn't appear to be encrypted
      if (!isEncryptedMessage(encryptedContent)) {
        return encryptedContent;
      }

      let roomKey = roomKeys[roomId];

      if (!roomKey && typeof window !== "undefined") {
        // Try to get from localStorage
        const stored = localStorage.getItem(`${ROOM_KEYS_PREFIX}${roomId}`);
        if (stored) {
          roomKey = stored;
          setRoomKeys((prev) => ({ ...prev, [roomId]: stored }));
        }
      }

      if (!roomKey) {
        // Key not found, return as-is (might not be encrypted)
        return encryptedContent;
      }

      try {
        return await decryptMessage(encryptedContent, roomKey);
      } catch {
        // Return original content if decryption fails
        // (might not be encrypted message)
        return encryptedContent;
      }
    },
    [isEnabled, roomKeys]
  );

  const value: ChatEncryptionContextType = {
    isEnabled,
    setEncryptionEnabled,
    getRoomKey,
    initializeRoomKey,
    encrypt,
    decrypt,
    isInitialized,
    isRoomEncrypted,
  };

  return (
    <ChatEncryptionContext.Provider value={value}>
      {children}
    </ChatEncryptionContext.Provider>
  );
}

export function useChatEncryption() {
  const context = useContext(ChatEncryptionContext);
  if (context === undefined) {
    throw new Error("useChatEncryption must be used within ChatEncryptionProvider");
  }
  return context;
}
