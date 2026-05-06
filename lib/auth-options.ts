import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email e senha são obrigatórios');
          }

          console.log('[AUTH] Buscando user:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log('[AUTH] Usuário não encontrado');
            throw new Error('Credenciais inválidas');
          }

          console.log('[AUTH] Usuário encontrado, hash existe:', !!user.hashedPassword);
          const isValid = await bcrypt.compare(credentials.password, user.hashedPassword!);
          console.log('[AUTH] Senha válida:', isValid);

          if (!isValid) {
            throw new Error('Credenciais inválidas');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (e: any) {
          console.error('[AUTH] Erro no authorize:', e.message);
          throw e;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
