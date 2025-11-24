import { UserProfile, UserRole, ChatMessage } from '../types';

const STORAGE_KEY_USER = 'nexa_current_user';
const STORAGE_KEY_USERS_DB = 'nexa_users_db';
const STORAGE_KEY_ADMIN_MEM = 'nexa_admin_memory';

const safeGet = (key: string) => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error("Storage Access Error", e);
        return null;
    }
}

const safeSet = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error("Storage Write Error", e);
    }
}

const safeRemove = (key: string) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {}
}

export const storageService = {
  // --- Auth ---
  login: (mobile: string): UserProfile | null => {
    const db = JSON.parse(safeGet(STORAGE_KEY_USERS_DB) || '{}');
    const user = db[mobile];
    if (user) {
      user.lastLogin = Date.now();
      safeSet(STORAGE_KEY_USER, JSON.stringify(user));
      // Update DB
      db[mobile] = user;
      safeSet(STORAGE_KEY_USERS_DB, JSON.stringify(db));
      return user;
    }
    return null;
  },

  adminLogin: (): UserProfile => {
    const adminProfile: UserProfile = {
      name: 'Chandan',
      mobile: 'ADMIN',
      role: UserRole.ADMIN,
      theme: 'Dark Neon',
      chatHistory: JSON.parse(safeGet(STORAGE_KEY_ADMIN_MEM) || '[]'),
      lastLogin: Date.now()
    };
    safeSet(STORAGE_KEY_USER, JSON.stringify(adminProfile));
    return adminProfile;
  },

  signup: (name: string, mobile: string): UserProfile => {
    const db = JSON.parse(safeGet(STORAGE_KEY_USERS_DB) || '{}');
    const newUser: UserProfile = {
      name,
      mobile,
      role: UserRole.USER,
      theme: 'Dark Neon',
      chatHistory: [],
      lastLogin: Date.now()
    };
    db[mobile] = newUser;
    safeSet(STORAGE_KEY_USERS_DB, JSON.stringify(db));
    safeSet(STORAGE_KEY_USER, JSON.stringify(newUser));
    return newUser;
  },

  getCurrentUser: (): UserProfile | null => {
    const data = safeGet(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    safeRemove(STORAGE_KEY_USER);
  },

  // --- Memory ---
  saveChat: (user: UserProfile, message: ChatMessage) => {
    // Update local object
    user.chatHistory.push(message);
    // Limit history
    if (user.chatHistory.length > 50) user.chatHistory.shift();

    // Persist
    if (user.role === UserRole.ADMIN) {
      safeSet(STORAGE_KEY_ADMIN_MEM, JSON.stringify(user.chatHistory));
      safeSet(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      const db = JSON.parse(safeGet(STORAGE_KEY_USERS_DB) || '{}');
      db[user.mobile] = user;
      safeSet(STORAGE_KEY_USERS_DB, JSON.stringify(db));
      safeSet(STORAGE_KEY_USER, JSON.stringify(user));
    }
  },

  clearAdminMemory: () => {
    safeRemove(STORAGE_KEY_ADMIN_MEM);
  }
};