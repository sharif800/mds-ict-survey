import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'MDS Account',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { officeEmail: normalizedEmail },
          include: { organization: true },
        });

        if (!user || !user.isActive) return null;
        if (user.authProvider === 'MICROSOFT') return null;
        if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.officeEmail,
          name: user.fullName,
          role: user.role,
          tenantName: user.organization?.tenantName,
          organizationId: user.organizationId,
          mustChangePassword: user.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'azure-ad') {
        if (!user.email) return false;
        const dbUser = await prisma.user.findUnique({
          where: { officeEmail: user.email },
          include: { organization: true },
        });
        if (!dbUser || !dbUser.isActive) return '/unauthorized';
        (user as any).role = dbUser.role;
        (user as any).tenantName = dbUser.organization?.tenantName;
        (user as any).id = dbUser.id;
        (user as any).organizationId = dbUser.organizationId;
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.tenantName = user.tenantName;
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.tenantName = token.tenantName;
        session.user.id = token.id;
        session.user.organizationId = token.organizationId;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
  pages: { signIn: '/', error: '/' },
  session: { strategy: 'jwt' },
  // ── SECURE BY DESIGN: Cross-Portal Authentication ──────────────────────────
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined,
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.callback-url` : `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined,
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? `__Host-next-auth.csrf-token` : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  }
};
