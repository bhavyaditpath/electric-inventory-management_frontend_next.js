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
  deriveMasterKeyFromSecret,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
} from "@/utils/chatEncryption";

const STORAGE_KEY = "chat_encryption_master_key";
const ENCRYPTION_ENABLED_KEY = "chat_encryption_enabled";
const ROOM_KEYS_PREFIX = "chat_room_key_shared_";
const LEGACY_ROOM_KEYS_PREFIX = "chat_room_key_";
const DEFAULT_SHARED_SECRET = "electric-inventory-chat-shared-v1";

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
  const [legacyMasterKey, setLegacyMasterKey] = useState<string | null>(null);
  const [roomKeys, setRoomKeys] = useState<Record<number, string>>({});
  const [legacyRoomKeys, setLegacyRoomKeys] = useState<Record<number, string>>({});
  const [isEnabled, setIsEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeKeys = async () => {
      const storedMasterKey = localStorage.getItem(STORAGE_KEY);
      const storedEnabled = localStorage.getItem(ENCRYPTION_ENABLED_KEY);

      if (storedMasterKey) {
        // Keep old per-user key for decrypting legacy messages.
        setLegacyMasterKey(storedMasterKey);
      }

      const sharedSecret =
        process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_SECRET || DEFAULT_SHARED_SECRET;
      const sharedMasterKey = await deriveMasterKeyFromSecret(sharedSecret);
      setMasterKey(sharedMasterKey);

      if (storedEnabled !== null) {
        setIsEnabled(storedEnabled === "true");
      }

      setIsInitialized(true);
    };

    void initializeKeys();
  }, []);

  const deriveAndStoreSharedRoomKey = useCallback(
    async (roomId: number) => {
      if (!masterKey) return null;
      const derived = await deriveRoomKey(masterKey, roomId);
      setRoomKeys((prev) => ({ ...prev, [roomId]: derived }));
      if (typeof window !== "undefined") {
        localStorage.setItem(`${ROOM_KEYS_PREFIX}${roomId}`, derived);
      }
      return derived;
    },
    [masterKey]
  );

  const deriveLegacyRoomKey = useCallback(
    async (roomId: number) => {
      if (!legacyMasterKey) return null;

      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(`${LEGACY_ROOM_KEYS_PREFIX}${roomId}`)
          : null;
      if (stored) {
        setLegacyRoomKeys((prev) => ({ ...prev, [roomId]: stored }));
        return stored;
      }

      const derived = await deriveRoomKey(legacyMasterKey, roomId);
      setLegacyRoomKeys((prev) => ({ ...prev, [roomId]: derived }));
      return derived;
    },
    [legacyMasterKey]
  );

  const getSharedRoomKey = useCallback(
    async (roomId: number) => {
      const fromState = roomKeys[roomId];
      if (fromState) return fromState;

      const fromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem(`${ROOM_KEYS_PREFIX}${roomId}`)
          : null;
      if (fromStorage) {
        setRoomKeys((prev) => ({ ...prev, [roomId]: fromStorage }));
        return fromStorage;
      }

      return deriveAndStoreSharedRoomKey(roomId);
    },
    [deriveAndStoreSharedRoomKey, roomKeys]
  );

  const getLegacyRoomKey = useCallback(
    async (roomId: number) => {
      const fromState = legacyRoomKeys[roomId];
      if (fromState) return fromState;
      return deriveLegacyRoomKey(roomId);
    },
    [deriveLegacyRoomKey, legacyRoomKeys]
  );

  const getAllCandidateRoomKeys = useCallback(
    async (roomId: number) => {
      const candidates = [
        await getSharedRoomKey(roomId),
        await getLegacyRoomKey(roomId),
      ].filter((value): value is string => !!value);

      return Array.from(new Set(candidates));
    },
    [getLegacyRoomKey, getSharedRoomKey]
  );

  const setEncryptionEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(ENCRYPTION_ENABLED_KEY, String(enabled));
    }
  }, []);

  const initializeRoomKey = useCallback(
    async (roomId: number) => {
      await getSharedRoomKey(roomId);
    },
    [getSharedRoomKey]
  );

  const getRoomKey = useCallback(
    (roomId: number): string | null => {
      return roomKeys[roomId] || null;
    },
    [roomKeys]
  );

  const isRoomEncrypted = useCallback(
    (roomId: number): boolean => {
      return !!roomKeys[roomId] || !!legacyRoomKeys[roomId];
    },
    [legacyRoomKeys, roomKeys]
  );

  const encrypt = useCallback(
    async (plaintext: string, roomId: number): Promise<string> => {
      if (!isEnabled) {
        return plaintext;
      }

      const roomKey = await getSharedRoomKey(roomId);

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
    [getSharedRoomKey, isEnabled]
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

      const candidateKeys = await getAllCandidateRoomKeys(roomId);
      if (candidateKeys.length === 0) {
        return encryptedContent;
      }

      for (const roomKey of candidateKeys) {
        try {
          return await decryptMessage(encryptedContent, roomKey);
        } catch {
          // Try next candidate key.
        }
      }

      return encryptedContent;
    },
    [getAllCandidateRoomKeys, isEnabled]
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
