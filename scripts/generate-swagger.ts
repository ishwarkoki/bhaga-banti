import swaggerJsdoc from 'swagger-jsdoc';
import { APP_NAME, APP_DESCRIPTION } from '../src/utils/constants.js';
import fs from 'fs';
import path from 'path';

const basePaths = {
  '/': {
    get: {
      tags: ['System'],
      summary: 'Get service entrypoint metadata',
      security: [],
      responses: { 200: { description: 'Service URLs' } },
    },
  },
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      security: [],
      responses: { 200: { description: 'Health status' } },
    },
  },
  '/api/auth/sign-up/email': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign up with email and password',
      security: [],
      responses: { 200: { description: 'User signed up' } },
    },
  },
  '/api/auth/sign-in/email': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign in with email and password',
      security: [],
      responses: { 200: { description: 'User signed in' } },
    },
  },
  '/api/auth/sign-in/social': {
    post: {
      tags: ['Authentication'],
      summary: 'Start social login',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['provider', 'callbackURL'],
              properties: {
                provider: { type: 'string', enum: ['google'] },
                callbackURL: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'OAuth initialized' } },
    },
  },
  '/api/auth/get-session': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current session',
      responses: { 200: { description: 'Session or null' } },
    },
    post: {
      tags: ['Authentication'],
      summary: 'Get current session (POST)',
      responses: { 200: { description: 'Session or null' } },
    },
  },
  '/api/auth/sign-out': {
    post: {
      tags: ['Authentication'],
      summary: 'Sign out',
      responses: { 200: { description: 'Signed out' } },
    },
  },
};

const scannedSpec = swaggerJsdoc({
  definition: { openapi: '3.0.0', paths: {} },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
});

const mergedPaths = { ...(scannedSpec.paths || {}), ...basePaths };
const spec = {
  openapi: '3.0.0',
  info: { title: APP_NAME, description: APP_DESCRIPTION, version: '1.0.0' },
  servers: [{ url: process.env.BETTER_AUTH_URL || 'https://bhaga-banti.onrender.com/' }],
  paths: mergedPaths,
};

const outputPath = 'dist/config/swagger-generated.json';
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
fs.copyFileSync(outputPath, 'src/config/swagger-generated.json');
console.log('Generated swagger spec:', Object.keys(spec.paths).length, 'paths');