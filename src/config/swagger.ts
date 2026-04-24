import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatedSpecPath = path.join(__dirname, 'swagger-generated.json');

const swaggerSpec = fs.existsSync(generatedSpecPath)
  ? JSON.parse(fs.readFileSync(generatedSpecPath, 'utf-8'))
  : { openapi: '3.0.0', info: { title: 'Bhaga-Banti', version: '1.0.0' }, paths: {} };

export { swaggerSpec };
