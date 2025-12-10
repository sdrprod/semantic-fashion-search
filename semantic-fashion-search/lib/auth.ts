import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseClient } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          const supabase = getSupabaseClient(true) as any;

          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user with viewer role by default
            await supabase.from('users').insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              role: 'viewer',
            });
          } else {
            // Update user info
            await supabase
              .from('users')
              .update({
                name: user.name,
                avatar_url: user.image,
                updated_at: new Date().toISOString(),
              })
              .eq('email', user.email);
          }

          return true;
        } catch (error) {
          console.error('Error saving user:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const supabase = getSupabaseClient(true) as any;
          const { data: user } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', session.user.email)
            .single();

          if (user) {
            session.user.id = user.id;
            session.user.role = user.role;
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
};

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: 'admin' | 'editor' | 'viewer';
    };
  }

  interface User {
    role?: 'admin' | 'editor' | 'viewer';
  }
}
