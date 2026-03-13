/**
 * Chat Message Encryption Utility
 * Uses Web Crypto API with AES-GCM for authenticated encryption
 */

// Encryption algorithm configuration
const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 128; // 128-bit authentication tag

/**
 * Generate a random encryption key for a chat room
 * @returns Base64 encoded encryption key
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Derive a deterministic 256-bit key from a shared secret string.
 * This allows all clients with the same secret to derive identical room keys.
 */
export async function deriveMasterKeyFromSecret(secret: string): Promise<string> {
  if (!secret) {
    throw new Error("Secret is required to derive master key");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

/**
 * Import a base64 encoded key
 * @param keyString Base64 encoded key
 * @returns CryptoKey
 */
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a message using AES-GCM
 * @param plaintext The message to encrypt
 * @param keyString Base64 encoded encryption key
 * @returns Encrypted message in format: base64(IV + ciphertext + tag)
 */
export async function encryptMessage(
  plaintext: string,
  keyString: string
): Promise<string> {
  if (!plaintext || !keyString) {
    throw new Error("Plaintext and key are required for encryption");
  }

  const key = await importKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  // Combine IV + encrypted data (which includes the authentication tag)
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a message using AES-GCM
 * @param encryptedString Encrypted message in format: base64(IV + ciphertext + tag)
 * @param keyString Base64 encoded encryption key
 * @returns Decrypted plaintext message
 */
export async function decryptMessage(
  encryptedString: string,
  keyString: string
): Promise<string> {
  if (!encryptedString || !keyString) {
    throw new Error("Encrypted string and key are required for decryption");
  }

  const key = await importKey(keyString);
  const combined = Uint8Array.from(atob(encryptedString), (c) =>
    c.charCodeAt(0)
  );

  // Extract IV and encrypted data (with tag)
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Check if a message appears to be encrypted
 * Encrypted messages will have a specific format when base64 decoded
 * @param content The message content to check
 * @returns true if the message appears to be encrypted
 */
export function isEncryptedMessage(content: string): boolean {
  if (!content) return false;

  try {
    // Check if it's valid base64 (encrypted content is always base64)
    if (!/^[A-Za-z0-9+/]+=*$/.test(content)) return false;
    
    const decoded = atob(content);
    // Encrypted messages have IV (12 bytes) + at least some ciphertext
    return decoded.length > IV_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Generate a room-specific key from a master key and room ID
 * This allows different encryption keys per room while using a single master key
 * @param masterKey Base64 encoded master key
 * @param roomId The chat room ID
 * @returns Derived key for the specific room
 */
export async function deriveRoomKey(
  masterKey: string,
  roomId: number
): Promise<string> {
  const encoder = new TextEncoder();
  const roomData = encoder.encode(`chat-room-${roomId}`);

  const keyData = Uint8Array.from(atob(masterKey), (c) => c.charCodeAt(0));

  const importedKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: roomData,
      iterations: 100000,
      hash: "SHA-256",
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await crypto.subtle.exportKey("raw", derivedKey);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Encrypt message metadata (for additional security)
 * @param metadata Object to encrypt
 * @param keyString Base64 encoded encryption key
 * @returns Encrypted string
 */
export async function encryptMetadata<T>(
  metadata: T,
  keyString: string
): Promise<string> {
  const jsonString = JSON.stringify(metadata);
  return encryptMessage(jsonString, keyString);
}

/**
 * Decrypt metadata
 * @param encryptedString Encrypted metadata string
 * @param keyString Base64 encoded encryption key
 * @returns Decrypted object
 */
export async function decryptMetadata<T>(
  encryptedString: string,
  keyString: string
): Promise<T> {
  const decrypted = await decryptMessage(encryptedString, keyString);
  return JSON.parse(decrypted) as T;
}
