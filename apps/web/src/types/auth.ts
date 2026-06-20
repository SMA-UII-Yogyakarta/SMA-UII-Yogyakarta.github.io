/**
 * Authentication & User Types
 */

import type { UserRole, UserStatus } from '@smauii/db/schema';

/**
 * User Session
 */
export interface UserSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

/**
 * User Profile
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nis?: string;
  nisn?: string;
  class?: string;
  role: UserRole;
  status: UserStatus;
  githubUsername?: string;
  githubId?: string;
  avatarUrl?: string;
  joinedAt: number;
  approvedBy?: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  identifier: string; // Can be NIS, NISN, or email
  password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  nis: string;
  name: string;
  email: string;
  class: string;
  githubUsername?: string;
  tracks: string[];
  password: string;
}

/**
 * GitHub OAuth State
 */
export interface GithubOAuthState {
  returnTo?: string;
  timestamp: number;
}

/**
 * Password Reset
 */
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}