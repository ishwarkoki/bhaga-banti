import swaggerJsdoc from 'swagger-jsdoc';
import { APP_NAME, APP_DESCRIPTION } from '../src/utils/constants.js';
import fs from 'fs';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      version: '1.0.0',
    },
    servers: [{ url: process.env.BETTER_AUTH_URL || 'http://localhost:3000' }],
    paths: {},
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const spec = swaggerJsdoc(options);
const outputPath = 'dist/src/config/swagger-generated.json';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log('Generated swagger spec to', outputPath);