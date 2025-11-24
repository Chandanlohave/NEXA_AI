import { UserProfile, UserRole, ChatMessage } from '../types';

const STORAGE_KEY_USER = 'nexa_current_user';
const STORAGE_KEY_USERS_DB = 'nexa_users_db';
const STORAGE_KEY_ADMIN_MEM = 'nexa_admin_memory';

export const storageService = {
  // --- Auth ---
  login: (mobile: string): UserProfile | null => {
    const db = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB) || '{}');
    const user = db[mobile];
    if (user) {
      user.lastLogin = Date.now();
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      // Update DB
      db[mobile] = user;
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
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
      chatHistory: JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN_MEM) || '[]'),
      lastLogin: Date.now()
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(adminProfile));
    return adminProfile;
  },

  signup: (name: string, mobile: string): UserProfile => {
    const db = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB) || '{}');
    const newUser: UserProfile = {
      name,
      mobile,
      role: UserRole.USER,
      theme: 'Dark Neon',
      chatHistory: [],
      lastLogin: Date.now()
    };
    db[mobile] = newUser;
    localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    return newUser;
  },

  getCurrentUser: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  // --- Memory ---
  saveChat: (user: UserProfile, message: ChatMessage) => {
    // Update local object
    user.chatHistory.push(message);
    // Limit history
    if (user.chatHistory.length > 50) user.chatHistory.shift();

    // Persist
    if (user.role === UserRole.ADMIN) {
      localStorage.setItem(STORAGE_KEY_ADMIN_MEM, JSON.stringify(user.chatHistory));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      const db = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_DB) || '{}');
      db[user.mobile] = user;
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }
  },

  clearAdminMemory: () => {
    localStorage.removeItem(STORAGE_KEY_ADMIN_MEM);
  }
};