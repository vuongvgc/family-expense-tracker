import NextAuth, { type DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      familyGroupId: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    familyGroupId: string;
    role: UserRole;
  }
}

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { email, password } = loginSchema.parse(credentials);

          // Find user by email with family group info
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              familyGroup: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          // Check if user exists
          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          // Return user object (will be encoded in JWT)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            familyGroupId: user.familyGroupId,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add custom fields to JWT
      if (user) {
        token.id = user.id;
        token.familyGroupId = user.familyGroupId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.familyGroupId = token.familyGroupId as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
