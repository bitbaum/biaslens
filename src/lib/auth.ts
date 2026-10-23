import { createAuthRuntime } from '@bitbaum/accountkit/auth/next';
import { conventionalFrom, isMailConfigured, sendMail } from '@bitbaum/mail-kit';
import { db } from '@/lib/db/client';

export const authSite = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  title: 'BiasLens',
  slug: 'biaslens',
};
const mailEnv = () => ({
  ...process.env,
  RESEND_FROM: process.env.RESEND_FROM || conventionalFrom(authSite.title),
});
export const mailConfigured = () => isMailConfigured(mailEnv());
export const { GET, POST, getSession, requireUser, authStatus, getAuth } = createAuthRuntime({
  site: authSite,
  isDatabaseConfigured: (env) => Boolean(env.DATABASE_URL),
  getDatabase: () => db,
  mail: {
    get configured() {
      return mailConfigured();
    },
    async send(kind, to, url) {
      const action = {
        verify: 'Verify your email',
        magicLink: 'Sign in to BiasLens',
        reset: 'Reset your password',
      }[kind];
      const result = await sendMail(
        {
          to,
          subject: action,
          text: `${action}\n\n${url}\n\nIf you did not request this, ignore this email.`,
        },
        { env: mailEnv() },
      );
      if (!result.sent)
        console.error('Account email delivery failed', result.status ?? 'transport');
    },
  },
});
