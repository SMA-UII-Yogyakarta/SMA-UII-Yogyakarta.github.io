/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    session: import('lucia').Session | null;
    user: import('lucia').User | null;
  }
}

// Window extensions for inline scripts in .astro pages
interface Window {
  markNotificationRead: (id: string) => Promise<void>;
  // Members
  approve: (id: string) => void;
  reject: (id: string) => void;
  filterMembers: (status: string) => void;
  searchMembers: (val: string) => void;
  openSetPasswordModal: (userId: string, userName: string) => void;
  closePasswordModal: () => void;
  setPassword: () => Promise<void>;
  goToPage: (page: number) => void;
  // Announcements
  editAnnouncement: (id: string, title: string, content: string) => void;
  deleteAnnouncement: (id: string, title: string) => Promise<void>;
  annPage: (page: number) => void;
  // Projects
  editProject: (id: string, title: string, description: string, url: string, imageUrl?: string) => void;
  deleteProject: (id: string, title: string) => Promise<void>;
  projPage: (page: number) => void;
  // Activities
  deleteActivity: (id: string, title: string) => Promise<void>;
  actPage: (page: number) => void;
}
