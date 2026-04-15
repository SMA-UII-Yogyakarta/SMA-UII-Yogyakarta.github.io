import type { APIRoute } from 'astro';
import { github } from '@lib/oauth';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users, sessions } from '@db/schema';
import { eq } from 'drizzle-orm';
import { OAuth2RequestError } from 'arctic';
import { createErrorResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github_oauth_state')?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return createErrorResponse('Invalid request', 400, { code: 'INVALID_STATE' });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    
    // Fetch GitHub user and emails in parallel
    const [githubUserResponse, githubEmailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      }),
    ]);
    
    const githubUser = await githubUserResponse.json();
    const githubEmails = await githubEmailsResponse.json();
    const primaryEmail = githubEmails.find((email: any) => email.primary)?.email;

    // Check if user exists in database by GitHub username (from seed data)
    let existingUser = await db.query.users.findFirst({
      where: eq(users.githubUsername, githubUser.login),
    });

    // If not found by username, try by GitHub ID
    if (!existingUser) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.githubId, githubUser.id.toString()),
      });
    }

    // If still not found, check if any user exists (for first-time GitHub login)
    if (!existingUser) {
      const allUsers = await db.query.users.findMany();
      if (allUsers.length === 0) {
        return createErrorResponse('No users found in database. Please contact administrator.', 404);
      }
      return createErrorResponse('GitHub username not registered. Please contact administrator.', 403);
    }

    const userId = existingUser.id;

    // Link GitHub ID if not already linked
    if (!existingUser.githubId) {
      await db.update(users)
        .set({
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          email: primaryEmail || existingUser.email,
        })
        .where(eq(users.id, existingUser.id));
    } else {
      // Update GitHub info if changed
      await db.update(users)
        .set({
          githubUsername: githubUser.login,
          email: primaryEmail || existingUser.email,
        })
        .where(eq(users.id, existingUser.id));
    }

    // Invalidate all existing sessions for this user (session fixation protection)
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // Create new session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Redirect based on role and status
    if (existingUser.status === 'pending') return redirect(`/check-status?nisn=${existingUser.nisn}`);
    if (existingUser.status === 'inactive') return redirect('/login?error=inactive');
    return redirect('/app/overview');
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      // Handle specific OAuth errors
      if (e.message === 'invalid_grant' || e.message === 'bad_verification_code') {
        return createErrorResponse('Authorization code expired or invalid. Please try again.', 400, { code: 'INVALID_CODE' });
      }
      return createErrorResponse('Authorization failed', 400, { code: 'OAUTH_ERROR' });
    }
    console.error('GitHub OAuth callback error:', e);
    return createErrorResponse('An error occurred during login. Please try again.', 500);
  }
};
