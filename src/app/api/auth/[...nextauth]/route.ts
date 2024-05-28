// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';
import winston from 'winston';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: path.join(process.cwd(), 'auth.log') })],
});

const ORG = 'instructlab';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.OAUTH_GITHUB_ID!,
      clientSecret: process.env.OAUTH_GITHUB_SECRET!,
      authorization: { params: { scope: 'read:user' } },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (
          credentials?.username === (process.env.IL_UI_ADMIN_USERNAME || 'admin') &&
          credentials?.password === (process.env.IL_UI_ADMIN_PASSWORD || 'password')
        ) {
          logger.info(`User ${credentials.username} logged in successfully with credentials`);
          return { id: '1', name: 'Admin', email: 'admin@example.com' };
        }
        logger.warn(`Failed login attempt with username: ${credentials?.username}`);
        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.id = token.id as string;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account.provider === 'github') {
        try {
          const response = await axios.get(`https://api.github.com/orgs/${ORG}/members/${profile.login}`, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
            validateStatus: (status) => {
              return [204, 302, 404].includes(status);
            },
          });

          if (response.status === 204) {
            console.log(`User ${profile.login} logged in successfully with GitHub`);
            logger.info(`User ${profile.login} logged in successfully with GitHub`);
            return true;
          } else if (response.status === 404) {
            console.log(`User ${profile.login} is not a member of the ${ORG} organization`);
            logger.warn(`User ${profile.login} is not a member of the ${ORG} organization`);
            return `/error?error=AccessDenied`; // Redirect to custom error page
          } else {
            console.log(`Unexpected error for user ${profile.login} during organization membership verification`);
            logger.error(`Unexpected error for user ${profile.login} during organization membership verification`);
            return false;
          }
        } catch (error) {
          logger.error(`Error fetching GitHub organization membership for user ${profile.login}: ${error.message}`);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
