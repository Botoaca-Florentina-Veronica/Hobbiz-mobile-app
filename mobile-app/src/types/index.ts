/**
 * Type definitions for Hobbiz Mobile App
 * Shared types across the application
 */

// ============================================
// User Types
// ============================================

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  googleId?: string;
  phone?: string;
  localitate?: string;
  favorites?: string[]; // Array of announcement IDs
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  id: string; // Alias for _id for frontend consistency
}

// ============================================
// Announcement Types
// ============================================

export interface Announcement {
  _id: string;
  user: string | User; // Can be populated or just ID
  title: string;
  description: string;
  category: string;
  location: string;
  price?: number;
  images?: string[];
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  description: string;
  category: string;
  location: string;
  price?: number;
  images?: string[];
}

export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> {
  _id: string;
}

// ============================================
// Message Types
// ============================================

export interface Message {
  _id: string;
  conversationId: string;
  sender: string | User;
  recipient: string | User;
  content: string;
  image?: string;
  reaction?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt: string;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'message' | 'review' | 'favorite' | 'announcement' | 'system';

export interface Notification {
  _id: string;
  user: string | User;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ============================================
// Review Types
// ============================================

export interface Review {
  _id: string;
  author?: string | User; // Optional for guest reviews
  authorName?: string; // For guest reviews
  targetUser: string | User;
  rating: number; // 1-5
  comment: string;
  likes?: string[]; // Array of user IDs who liked
  likesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewInput {
  targetUser: string;
  rating: number;
  comment: string;
  authorName?: string; // For guest reviews
}

// ============================================
// Alert Types (MITM Detection)
// ============================================

export interface Alert {
  _id: string;
  username?: string;
  alert: string;
  timestamp: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================
// Filter & Sort Types
// ============================================

export type SortOption = 'cea mai recenta' | 'cea mai veche' | 'titlu_a_z' | 'titlu_z_a';

export interface AnnouncementFilters {
  searchTerm?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: SortOption;
}

// ============================================
// Theme Types
// ============================================

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryContrast: string;
  secondary: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  surface: string;
  border: string;
  overlay: string;
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
  '(tabs)': undefined;
  login: undefined;
  'my-announcements': undefined;
  settings: undefined;
  profile: { userId?: string };
  notifications: undefined;
  about: undefined;
  legal: undefined;
  'legal/terms': undefined;
  'legal/privacy': undefined;
  'legal/cookies': undefined;
  modal: undefined;
};

export type TabParamList = {
  index: undefined;
  favorites: undefined;
  sell: undefined;
  chat: undefined;
  account: undefined;
};

// ============================================
// Utility Types
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================
// Component Prop Types
// ============================================

export interface BaseComponentProps {
  className?: string;
  style?: any;
  testID?: string;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

// ============================================
// Form Types
// ============================================

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

// ============================================
// Category Types
// ============================================

export const CATEGORIES = [
  'Muzică',
  'Sport',
  'Artă',
  'Tehnologie',
  'Gradinărit',
  'Bucătărie',
  'Dans',
  'Fotografie',
  'Croșetat',
  'Alte servicii',
] as const;

export type Category = typeof CATEGORIES[number];

// ============================================
// All types are exported as named exports above
// Import like: import { User, Announcement } from '@/types'
// ============================================
