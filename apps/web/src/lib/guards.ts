import type { AstroGlobal } from 'astro';

/**
 * Server-side auth guards for Mode A (SSR) only.
 * 
 * DEPLOY_MODE modes:
 * - Mode A (ssr): Guards active, uses Astro.locals.user from Lucia session
 * - Mode B/C (ssg): Guards return null, client-side auth handles everything
 * 
 * In SSG mode, pages should:
 * 1. Not call guards (or call them - they return null)
 * 2. Use client-side auth detection (localStorage token + /api/auth/me fetch)
 * 3. Redirect client-side based on auth state
 * 
 * @see {@link ../docs/DEPLOYMENT_ARCHITECTURE.md} for multi-mode strategy
 */

type RedirectResponse = Response;

const isSSGMode = () => {
  try {
    return import.meta.env.DEPLOY_MODE === 'ssg';
  } catch {
    return process.env.DEPLOY_MODE === 'ssg';
  }
};

export function requireAuth(Astro: AstroGlobal): RedirectResponse | null {
  if (isSSGMode()) return null;
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.status === 'pending') return Astro.redirect(`/check-status?nis=${user.nis}`);
  if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
  return null;
}

export function requireMaintainer(Astro: AstroGlobal): RedirectResponse | null {
  if (isSSGMode()) return null;
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.role !== 'maintainer') return Astro.redirect('/app/overview');
  return null;
}

export function requireMember(Astro: AstroGlobal): RedirectResponse | null {
  if (isSSGMode()) return null;
  const { user } = Astro.locals;
  if (!user) return Astro.redirect('/login');
  if (user.role === 'maintainer') return Astro.redirect('/app/overview');
  if (user.status === 'pending') return Astro.redirect(`/check-status?nis=${user.nis}`);
  if (user.status === 'inactive') return Astro.redirect('/login?error=inactive');
  return null;
}

/** Alumni cannot create new content (activities, projects) but can view history */
export function requireActiveMember(Astro: AstroGlobal): RedirectResponse | null {
  if (isSSGMode()) return null;
  const guard = requireMember(Astro);
  if (guard) return guard;
  const { user } = Astro.locals;
  if (user!.role === 'alumni') return Astro.redirect('/app/overview');
  return null;
}

