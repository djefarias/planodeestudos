import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Referência global pro Prisma
let cachedPrisma: any = null;
async function getPrisma() {
  if (!cachedPrisma) {
    const { PrismaClient } = await import('@prisma/client');
    cachedPrisma = new PrismaClient();
  }
  return cachedPrisma;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const prisma = await getPrisma();
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || !user.hashedPassword) return null;

          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!isValid) return null;

          return { id: user.id, email: user.email, name: user.name };
        } catch (e) {
          console.error('[authorize error]', e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};
