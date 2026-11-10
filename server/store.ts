import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  encryptPayload,
  decryptPayload,
  hashPassword,
  verifyPassword,
} from './security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '.data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.enc');

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
  role: 'user' | 'admin';
}

export interface StoredConversation {
  id: string;
  userId: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    language?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMemory {
  id: string;
  userId: string;
  content: string;
  category: string;
  createdAt: string;
}

interface VaultData {
  users: StoredUser[];
  conversations: StoredConversation[];
  memories: StoredMemory[];
  updatedAt: string;
}

let inMemoryVault: VaultData = {
  users: [],
  conversations: [],
  memories: [],
  updatedAt: new Date().toISOString(),
};

export function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(VAULT_FILE)) {
      const rawEncrypted = fs.readFileSync(VAULT_FILE, 'utf8');
      const decrypted = decryptPayload<VaultData>(rawEncrypted);
      if (decrypted && Array.isArray(decrypted.users)) {
        inMemoryVault = decrypted;
        console.log(`[HARVEY VAULT] Loaded securely from disk. Users: ${inMemoryVault.users.length}, Conversations: ${inMemoryVault.conversations.length}`);
        return;
      }
    }

    // Initialize fresh vault
    saveVault();
    console.log('[HARVEY VAULT] Initialized fresh encrypted data vault.');
  } catch (err) {
    console.error('[HARVEY VAULT] Initialization warning, using in-memory vault:', err);
  }
}

export function saveVault() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    inMemoryVault.updatedAt = new Date().toISOString();
    const encryptedString = encryptPayload(inMemoryVault);
    const tempFile = `${VAULT_FILE}.tmp-${Date.now()}`;
    fs.writeFileSync(tempFile, encryptedString, 'utf8');
    fs.renameSync(tempFile, VAULT_FILE);
  } catch (err) {
    console.error('[HARVEY VAULT] Failed to persist encrypted vault to disk:', err);
  }
}

// ==========================================
// USER REPOSITORY
// ==========================================

export function findUserByUsername(username: string): StoredUser | undefined {
  const normalized = username.trim().toLowerCase();
  return inMemoryVault.users.find(u => u.username.toLowerCase() === normalized);
}

export function findUserById(userId: string): StoredUser | undefined {
  return inMemoryVault.users.find(u => u.id === userId);
}

export function createUser(username: string, plainTextPassword: string): { user?: StoredUser; error?: string } {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return { error: 'Username must be between 3 and 30 characters.' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return { error: 'Username can only contain letters, numbers, hyphens, and underscores.' };
  }

  if (plainTextPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(plainTextPassword) || !/[a-z]/.test(plainTextPassword) || !/[0-9]/.test(plainTextPassword)) {
    return { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' };
  }

  if (findUserByUsername(cleanUsername)) {
    return { error: 'A user with this username already exists.' };
  }

  const { salt, hash } = hashPassword(plainTextPassword);
  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    username: cleanUsername,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    role: inMemoryVault.users.length === 0 ? 'admin' : 'user', // first user is admin
  };

  inMemoryVault.users.push(newUser);
  saveVault();
  return { user: newUser };
}

export function authenticateUser(username: string, plainTextPassword: string): StoredUser | null {
  const user = findUserByUsername(username);
  if (!user) return null;

  const isValid = verifyPassword(plainTextPassword, user.salt, user.passwordHash);
  if (!isValid) return null;

  user.lastLoginAt = new Date().toISOString();
  saveVault();
  return user;
}

// ==========================================
// CONVERSATIONS REPOSITORY
// ==========================================

export function saveUserConversation(
  userId: string,
  conversationId: string,
  title: string,
  messages: StoredConversation['messages']
): StoredConversation {
  const existingIndex = inMemoryVault.conversations.findIndex(
    c => c.id === conversationId && c.userId === userId
  );

  const now = new Date().toISOString();
  if (existingIndex >= 0) {
    inMemoryVault.conversations[existingIndex].title = title || inMemoryVault.conversations[existingIndex].title;
    inMemoryVault.conversations[existingIndex].messages = messages;
    inMemoryVault.conversations[existingIndex].updatedAt = now;
    saveVault();
    return inMemoryVault.conversations[existingIndex];
  } else {
    const newConv: StoredConversation = {
      id: conversationId || `conv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      title: title || 'New Conversation',
      messages,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryVault.conversations.unshift(newConv);
    saveVault();
    return newConv;
  }
}

export function getUserConversations(userId: string): StoredConversation[] {
  return inMemoryVault.conversations
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function deleteUserConversation(userId: string, conversationId: string): boolean {
  const initialLen = inMemoryVault.conversations.length;
  inMemoryVault.conversations = inMemoryVault.conversations.filter(
    c => !(c.id === conversationId && c.userId === userId)
  );
  if (inMemoryVault.conversations.length !== initialLen) {
    saveVault();
    return true;
  }
  return false;
}

export function purgeAllUserData(userId: string): { conversationsDeleted: number; memoriesDeleted: number } {
  const convBefore = inMemoryVault.conversations.length;
  inMemoryVault.conversations = inMemoryVault.conversations.filter(c => c.userId !== userId);
  const conversationsDeleted = convBefore - inMemoryVault.conversations.length;

  const memBefore = inMemoryVault.memories.length;
  inMemoryVault.memories = inMemoryVault.memories.filter(m => m.userId !== userId);
  const memoriesDeleted = memBefore - inMemoryVault.memories.length;

  saveVault();
  return { conversationsDeleted, memoriesDeleted };
}

// ==========================================
// MEMORIES REPOSITORY
// ==========================================

export function getUserMemories(userId: string): StoredMemory[] {
  return inMemoryVault.memories.filter(m => m.userId === userId);
}

export function addUserMemory(userId: string, content: string, category = 'general'): StoredMemory {
  const newMem: StoredMemory = {
    id: `mem-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId,
    content: content.trim(),
    category,
    createdAt: new Date().toISOString(),
  };
  inMemoryVault.memories.push(newMem);
  saveVault();
  return newMem;
}

export function deleteUserMemory(userId: string, memoryId: string): boolean {
  const initialLen = inMemoryVault.memories.length;
  inMemoryVault.memories = inMemoryVault.memories.filter(
    m => !(m.id === memoryId && m.userId === userId)
  );
  if (inMemoryVault.memories.length !== initialLen) {
    saveVault();
    return true;
  }
  return false;
}
