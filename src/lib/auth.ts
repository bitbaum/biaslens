import { createAuthRuntime } from '@bitbaum/accountkit/auth/next';
import { createAuthMailer } from '@bitbaum/accountkit/auth/mail';
import { db } from '@/lib/db/client';

export const authSite = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  title: 'BiasLens',
  slug: 'biaslens',
};
// AccountKit's shared account mail (mail-kit underneath): the same subjects,
// the same origin check, and whatever account mail AccountKit learns next.
const authMail = createAuthMailer({ site: authSite });
export const mailConfigured = () => authMail.configured;
export const { GET, POST, getSession, requireUser, authStatus, getAuth } = createAuthRuntime({
  site: authSite,
  isDatabaseConfigured: (env) => Boolean(env.DATABASE_URL),
  getDatabase: () => db,
  mail: authMail,
});
