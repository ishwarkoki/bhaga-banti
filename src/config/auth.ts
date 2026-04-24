import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './database.js';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const trustedOrigins = [process.env.BETTER_AUTH_URL, process.env.FRONTEND_URL].filter(
  (origin): origin is string => Boolean(origin),
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  user: {
    modelName: 'users',
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
      },
      preferredLanguage: {
        type: 'string',
        required: false,
        defaultValue: 'en',
      },
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'Asia/Kolkata',
      },
    },
  },

  // Social Providers
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,

  session: {
    modelName: 'sessions',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },

  account: {
    modelName: 'accounts',
  },

  verification: {
    modelName: 'verifications',
  },
});

export type AuthType = typeof auth;
