import swaggerJsdoc from 'swagger-jsdoc';
import { APP_NAME, APP_DESCRIPTION } from '../utils/constants.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const possiblePaths = [
  path.join(__dirname, 'swagger-generated.json'),
  path.join(__dirname, '..', '..', 'src', 'config', 'swagger-generated.json'),
];
const generatedSpecPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      version: '1.0.0',
      contact: {
        name: 'Bhaga-Banti Support',
        email: 'support@bhaga-banti.com',
      },
    },
    servers: [
      {
        url: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/': {
        get: {
          tags: ['System'],
          summary: 'Get service entrypoint metadata',
          security: [],
          responses: {
            200: {
              description: 'Service URLs for API clients',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'bhaga-banti' },
                      docsUrl: { type: 'string', format: 'uri' },
                      healthUrl: { type: 'string', format: 'uri' },
                      authUrl: { type: 'string', format: 'uri' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          security: [],
          responses: {
            200: {
              description: 'Application health status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      service: { type: 'string', example: 'bhaga-banti' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/sign-up/email': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign up with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Ishwar' },
                    email: { type: 'string', format: 'email', example: 'ishwar@example.com' },
                    password: { type: 'string', format: 'password', example: 'SuperSecret123!' },
                    image: { type: 'string', format: 'uri', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'User signed up and session created',
            },
            400: {
              description: 'Invalid signup request',
            },
          },
        },
      },
      '/api/auth/sign-in/email': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign in with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'ishwar@example.com' },
                    password: { type: 'string', format: 'password', example: 'SuperSecret123!' },
                    rememberMe: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'User signed in and session created',
            },
            401: {
              description: 'Invalid credentials',
            },
          },
        },
      },
      '/api/auth/sign-in/social': {
        post: {
          tags: ['Authentication'],
          summary: 'Start social login',
          description:
            'Initiates the OAuth flow. For Google, this starts a browser redirect and is better tested from a browser/client app than Swagger.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                example: {
                  provider: 'google',
                  callbackURL: 'http://localhost:3001/auth/callback',
                  disableRedirect: false,
                },
                schema: {
                  type: 'object',
                  required: ['provider', 'callbackURL'],
                  properties: {
                    provider: {
                      type: 'string',
                      enum: ['google'],
                      example: 'google',
                    },
                    callbackURL: {
                      type: 'string',
                      format: 'uri',
                      example: 'http://localhost:3001/auth/callback',
                    },
                    newUserCallbackURL: {
                      type: 'string',
                      format: 'uri',
                      nullable: true,
                      example: 'http://localhost:3001/auth/new-user',
                    },
                    errorCallbackURL: {
                      type: 'string',
                      format: 'uri',
                      nullable: true,
                      example: 'http://localhost:3001/auth/error',
                    },
                    disableRedirect: {
                      type: 'boolean',
                      default: false,
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'OAuth flow initialized',
            },
            400: {
              description: 'Invalid social sign-in request',
            },
          },
        },
      },
      '/api/auth/get-session': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current session',
          responses: {
            200: {
              description: 'Current authenticated session or null',
            },
          },
        },
        post: {
          tags: ['Authentication'],
          summary: 'Get current session',
          description: 'POST is also supported by Better Auth for session refresh scenarios.',
          responses: {
            200: {
              description: 'Current authenticated session or null',
            },
          },
        },
      },
      '/api/auth/sign-out': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign out current user',
          responses: {
            200: {
              description: 'Session revoked successfully',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session_token',
        },
      },
      schemas: {
        // User schema
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            emailVerified: { type: 'boolean' },
            image: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            preferredLanguage: { type: 'string', default: 'en' },
            timezone: { type: 'string', default: 'Asia/Kolkata' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Group schema
        Group: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            createdBy: { type: 'string', format: 'uuid' },
            defaultSplitType: { type: 'string', enum: ['equal', 'exact', 'percentage', 'shares'] },
            currency: { type: 'string', default: 'INR' },
            isArchived: { type: 'boolean' },
            avatar: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Expense schema
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            groupId: { type: 'string', format: 'uuid' },
            paidBy: { type: 'string', format: 'uuid' },
            amount: { type: 'number', minimum: 0 },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'food',
                'transportation',
                'housing',
                'utilities',
                'entertainment',
                'shopping',
                'health',
                'travel',
                'education',
                'personal',
                'other',
              ],
            },
            expenseDate: { type: 'string', format: 'date-time' },
            splitType: { type: 'string', enum: ['equal', 'exact', 'percentage', 'shares'] },
            notes: { type: 'string', nullable: true },
            receiptUrl: { type: 'string', nullable: true },
            isRecurring: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Balance schema
        Balance: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            userName: { type: 'string' },
            userEmail: { type: 'string' },
            amount: { type: 'number', description: 'Positive = owed to them, Negative = they owe' },
          },
        },
        // Transaction schema (simplified debt)
        Transaction: {
          type: 'object',
          properties: {
            from: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            to: {
              type: 'object',
              properties: {
                userId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            amount: { type: 'number' },
          },
        },
        // Settlement schema
        Settlement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            groupId: { type: 'string', format: 'uuid' },
            fromUserId: { type: 'string', format: 'uuid' },
            toUserId: { type: 'string', format: 'uuid' },
            amount: { type: 'number', minimum: 0 },
            method: { type: 'string', enum: ['cash', 'upi', 'bank_transfer', 'other'] },
            notes: { type: 'string', nullable: true },
            settledAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Invitation schema
        Invitation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            groupId: { type: 'string', format: 'uuid' },
            token: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            status: { type: 'string', enum: ['pending', 'accepted', 'expired', 'revoked'] },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Error schema
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        // Success Response
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options) as any;

const baseSpecPaths = swaggerSpec.paths || {};
const scannedPaths = fs.existsSync(generatedSpecPath)
  ? JSON.parse(fs.readFileSync(generatedSpecPath, 'utf-8')).paths
  : {};

swaggerSpec.paths = {
  ...baseSpecPaths,
  ...scannedPaths,
};

export { swaggerSpec };
