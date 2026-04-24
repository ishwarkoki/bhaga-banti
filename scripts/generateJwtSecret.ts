import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 1. Generate secure secret
const secret = crypto.randomBytes(64).toString('hex');

// 2. Define file path
const filePath = path.join(process.cwd(), 'secrets.json');

// 3. Prepare JSON structure
const data = {
  JWT_SECRET: secret,
  createdAt: new Date().toISOString(),
};
// 4. Save to file
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log('✅ Secret generated and saved to secrets.json');
