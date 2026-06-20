/**
 * Component Props Types
 * Shared types for React and Astro components
 */

import type { TrackValue } from '@smauii/validation';

/**
 * Toast Notification
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Modal Props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Pagination Props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Member Card Props
 */
export interface MemberCardProps {
  id: string;
  name: string;
  class?: string;
  role: 'member' | 'maintainer' | 'alumni';
  tracks?: TrackValue[];
  avatarUrl?: string;
}

/**
 * Project Card Props
 */
export interface ProjectCardProps {
  id: string;
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  userName?: string;
  createdAt: number;
}

/**
 * Activity Props
 */
export interface ActivityProps {
  id: string;
  type: 'contribution' | 'event' | 'workshop' | 'meeting' | 'other';
  title: string;
  description?: string;
  url?: string;
  createdAt: number;
}

/**
 * Announcement Props
 */
export interface AnnouncementProps {
  id: string;
  title: string;
  content: string;
  isPinned?: boolean;
  createdAt: number;
}

/**
 * Notification Props
 */
export interface NotificationProps {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}