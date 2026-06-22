// ---------------------------------------------------------------------------
// Site & institution config — hardcoded defaults, overridable via env
// Astro 6 best practice: static import.meta.env.XXX access
// For scripts (non-Vite): process.env.XXX with try/catch fallback
// ---------------------------------------------------------------------------

function readStr(key: string, fallback: string): string {
  try { return (import.meta as Record<string, any>).env[key] || process.env[key] || fallback; }
  catch { return process.env[key] || fallback; }
}

function readBool(key: string, fallback: boolean): boolean {
  const v = readStr(key, String(fallback));
  return v === 'true' || v === '1';
}

export const DEFAULT_CONFIG = {
  site: {
    name: readStr('SITE_NAME', 'SMA UII Lab'),
    description: readStr('SITE_DESCRIPTION', 'Ruang eksplorasi digital buat yang suka ngulik teknologi'),
    themeColor: readStr('SITE_THEME_COLOR', '#3b82f6'),
    logoSymbol: readStr('SITE_LOGO_SYMBOL', '⬡'),
    url: readStr('PUBLIC_SITE_URL', 'http://localhost:4321'),
    isProd: readBool('PROD', false) || readStr('NODE_ENV', 'development') === 'production',
  },
  institution: {
    name: readStr('INSTITUTION_NAME', 'SMA Universitas Islam Indonesia Yogyakarta'),
    shortName: readStr('INSTITUTION_SHORT_NAME', 'SMA UII'),
    location: readStr('INSTITUTION_LOCATION', 'Yogyakarta'),
    website: readStr('INSTITUTION_WEBSITE', 'https://smauiiyk.sch.id'),
  },
  deployment: {
    domain: readStr('DEPLOY_DOMAIN', 'lab.smauiiyk.sch.id'),
    repository: readStr('DEPLOY_REPOSITORY', 'https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io'),
  },
  socials: {
    github: readStr('SOCIAL_GITHUB_ORG', 'https://github.com/SMA-UII-Yogyakarta'),
    maintainerGithub: readStr('SOCIAL_GITHUB_MAINTAINER', 'https://github.com/sandikodev'),
  },
  features: {
    slimsIntegration: !!readStr('SLIMS_API_URL', ''),
    birthdayEvents: readBool('FEATURE_BIRTHDAY_EVENTS', true),
  },
} as const;

export const getSiteConfig = () => DEFAULT_CONFIG;

export type SiteConfig = typeof DEFAULT_CONFIG;

// ---------------------------------------------------------------------------
// Track definitions — configurable via env TRACK_OPTIONS (JSON array)
// ---------------------------------------------------------------------------

export interface TrackDef {
  value: string;
  label: string;
}

const DEFAULT_TRACKS: TrackDef[] = [
  { value: 'robotika', label: 'Robotika/IoT' },
  { value: 'ai', label: 'AI (Kecerdasan Buatan)' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'network', label: 'Jaringan Komputer' },
  { value: 'security', label: 'Keamanan Siber' },
  { value: 'software', label: 'Software Engineering' },
];

let _parsedTracks: TrackDef[] | null = null;

function parseTracks(): TrackDef[] {
  if (_parsedTracks) return _parsedTracks;
  try {
    const raw = import.meta.env.TRACK_OPTIONS;
    if (raw) { _parsedTracks = JSON.parse(raw); return _parsedTracks; }
  } catch {
    try { const raw = process.env.TRACK_OPTIONS; if (raw) { _parsedTracks = JSON.parse(raw); return _parsedTracks; } } catch {}
  }
  _parsedTracks = [...DEFAULT_TRACKS];
  return _parsedTracks;
}

export function getTrackOptions(): TrackDef[] {
  return parseTracks().map(t => ({ ...t }));
}

export function getTrackValues(): string[] {
  return parseTracks().map(t => t.value);
}

// ---------------------------------------------------------------------------
// Class list — configurable via env CLASS_LIST (comma-separated)
// ---------------------------------------------------------------------------

const DEFAULT_CLASSES: string[] = [
  'X IPA 1', 'X IPA 2', 'X IPA 3', 'X IPA 4',
  'X IPS 1', 'X IPS 2', 'X IPS 3',
  'XI IPA 1', 'XI IPA 2', 'XI IPA 3', 'XI IPA 4',
  'XI IPS 1', 'XI IPS 2', 'XI IPS 3',
  'XII IPA 1', 'XII IPA 2', 'XII IPA 3', 'XII IPA 4',
  'XII IPS 1', 'XII IPS 2', 'XII IPS 3',
];

let _parsedClasses: string[] | null = null;

function parseClasses(): string[] {
  if (_parsedClasses) return _parsedClasses;
  try {
    const raw = import.meta.env.CLASS_LIST;
    if (raw) { _parsedClasses = raw.split(',').map(s => s.trim()).filter(Boolean); return _parsedClasses; }
  } catch {
    try { const raw = process.env.CLASS_LIST; if (raw) { _parsedClasses = raw.split(',').map(s => s.trim()).filter(Boolean); return _parsedClasses; } } catch {}
  }
  _parsedClasses = [...DEFAULT_CLASSES];
  return _parsedClasses;
}

export function getClassOptions(): string[] {
  return [...parseClasses()];
}
