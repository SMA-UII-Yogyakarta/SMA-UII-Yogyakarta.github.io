import type { APIRoute } from 'astro';
import { github } from '@lib/oauth';
import { lucia } from '@lib/auth';
import { db, users, sessions } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { OAuth2RequestError } from 'arctic';
import { createErrorResponse, ErrorCode } from '@smauii/shared';
import { verifySignedState, extractReturnTo } from './index';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const signedState = url.searchParams.get('state');
  const state = signedState ? verifySignedState(signedState) : null;

  if (!code || !state) {
    return createErrorResponse('Invalid request', 400, { code: ErrorCode.INVALID_STATE });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);

    const [githubUserResponse, githubEmailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      }),
    ]);

    const githubUser = await githubUserResponse.json();
    const githubEmails = await githubEmailsResponse.json();

    interface GitHubEmail {
      email: string;
      primary: boolean;
      verified: boolean;
      visibility: string | null;
    }

    const primaryEmail = (githubEmails as GitHubEmail[]).find((email) => email.primary)?.email;

    let existingUser = await db.query.users.findFirst({
      where: eq(users.githubUsername, githubUser.login),
    });

    if (!existingUser) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.githubId, githubUser.id.toString()),
      });
    }

    if (!existingUser) {
      const allUsers = await db.query.users.findMany();
      if (allUsers.length === 0) {
        return createErrorResponse('No users found in database. Please contact administrator.', 404, { code: ErrorCode.NOT_FOUND });
      }
      return createErrorResponse('GitHub username not registered. Please contact administrator.', 403, { code: ErrorCode.USER_NOT_FOUND });
    }

    const userId = existingUser.id;

    if (!existingUser.githubId) {
      await db.update(users)
        .set({ githubId: githubUser.id.toString(), githubUsername: githubUser.login, email: primaryEmail || existingUser.email })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.update(users)
        .set({ githubUsername: githubUser.login, email: primaryEmail || existingUser.email })
        .where(eq(users.id, existingUser.id));
    }

    await db.delete(sessions).where(eq(sessions.userId, userId));

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    if (existingUser.status === 'pending') return redirect(`/check-status?nisn=${existingUser.nisn}`);
    if (existingUser.status === 'inactive') return redirect('/login?error=inactive');
    return redirect(extractReturnTo(state));
  } catch (e) {
    if (e instanceof OAuth2RequestError) {
      if (e.message === 'invalid_grant' || e.message === 'bad_verification_code') {
        return createErrorResponse('Authorization code expired or invalid. Please try again.', 400, { code: ErrorCode.INVALID_CODE });
      }
      return createErrorResponse('Authorization failed', 400, { code: ErrorCode.OAUTH_ERROR });
    }
    console.error('GitHub OAuth callback error:', e);
    return createErrorResponse('An error occurred during login. Please try again.', 500, { code: ErrorCode.INTERNAL_ERROR });
  }
};
