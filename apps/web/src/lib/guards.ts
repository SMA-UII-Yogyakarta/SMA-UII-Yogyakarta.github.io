import type { AstroGlobal } from 'astro';

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

