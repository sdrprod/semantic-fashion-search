import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabaseClient } from './supabase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const supabase = getSupabaseClient(true) as any;

        // Fetch user from database
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, password, role, emailVerified, image')
          .eq('email', credentials.email.toLowerCase())
          .single();

        if (error || !user) {
          throw new Error('Invalid email or password');
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email address before signing in');
        }

        // Check if user has a password (might be OAuth-only)
        if (!user.password) {
          throw new Error('This email is registered with Google. Please sign in with Google.');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Return user object (password will not be included in session)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Sign in - User:', user.email);

      if (account?.provider === 'google' && user.email) {
        try {
          const supabase = getSupabaseClient(true) as any;

          // Check if user exists in our database
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user
            console.log('[NextAuth] Creating new user:', user.email);
            const { error } = await supabase.from('users').insert({
              email: user.email,
              name: user.name,
              image: user.image,
              role: 'viewer',
              emailVerified: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            if (error) {
              console.error('[NextAuth] Error creating user:', error);
            } else {
              console.log('[NextAuth] User created successfully');
            }
          } else {
            // Update last login time
            console.log('[NextAuth] User exists, updating info');
            await supabase
              .from('users')
              .update({
                name: user.name,
                image: user.image,
                updatedAt: new Date().toISOString(),
              })
              .eq('email', user.email);
          }

          return true;
        } catch (error) {
          console.error('[NextAuth] Error in signIn callback:', error);
          return true; // Allow sign in even if database update fails
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // On first sign in, add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // Fetch role from database
        try {
          const supabase = getSupabaseClient(true) as any;
          const { data: dbUser } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

          token.role = dbUser?.role || 'viewer';
          console.log('[NextAuth] JWT - User role:', token.role);
        } catch (error) {
          console.error('[NextAuth] Error fetching role:', error);
          token.role = 'viewer';
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user info from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.role = (token.role as 'admin' | 'editor' | 'viewer') || 'viewer';
      }

      console.log('[NextAuth] Session - User:', session.user?.email, 'Role:', session.user?.role);
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}
