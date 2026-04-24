import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema/index.js';
import { logger, toLogError } from './logger.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error', {
    error: toLogError(error),
  });
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
