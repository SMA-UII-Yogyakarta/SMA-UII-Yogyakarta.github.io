export {
  createErrorResponse,
  createSuccessResponse,
  parseJsonBody,
  getClientIp,
  requireRole,
  requireAuth,
  ErrorCode,
  type HttpStatus,
  type ApiError,
  type ApiSuccess,
  type ErrorCodeType,
  type UserSession,
} from './api-utils.js';

export {
  sendApprovalEmail,
  sendRejectionEmail,
  sendAnnouncementEmail,
  sendPasswordResetEmail,
  sendRegistrationEmail,
} from './email.js';

export {
  DEFAULT_CONFIG,
  getSiteConfig,
  getTrackOptions,
  getTrackValues,
  getClassOptions,
  type SiteConfig,
  type TrackDef,
} from './config.js';

// Env vars accessed via direct import.meta.env.XXX (Astro 6 convention)
// — no centralized env.ts to avoid breaking Vite's static analysis
