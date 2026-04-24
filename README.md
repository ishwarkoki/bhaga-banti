# 🎉 Bhaga-Banti

> **Bhaga-Banti** (ଭଗ-ବଣ୍ଟି) is "Sharing-Dividing" in Odia. A Splitwise clone for sharing expenses with friends and family.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-404d59?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-000000?style=flat&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-7C3AED?style=flat&logo=shield&logoColor=white)](https://www.better-auth.com/)

## ✨ Features

- 🔐 **Google OAuth** authentication with Better Auth
- 👥 **Group Management** - Create groups, add/remove members
- 💰 **Expense Tracking** - Add expenses with multiple split types:
  - Equal split
  - Exact amounts
  - Percentage split
  - Shares-based split
- 📊 **Balance Calculation** - Real-time balance tracking
- 🧮 **Debt Simplification** - Minimize transactions using graph algorithm
- 💸 **Settlement Recording** - Track payments between members
- 📧 **Email Notifications** - Gmail + Nodemailer integration
- 🔗 **Invite Links** - Shareable magic links to join groups
- 📱 **Mobile-Ready API** - RESTful API designed for mobile apps
- 🛡️ **Rate Limiting** - Protection against abuse
- 📚 **Swagger Docs** - Interactive API documentation

## 🏗️ Architecture

```
bhaga-banti/
├── src/
│   ├── config/           # Configuration files
│   │   ├── auth.ts      # Better Auth setup
│   │   ├── database.ts  # Drizzle + PostgreSQL
│   │   ├── email.ts     # Nodemailer config
│   │   └── swagger.ts   # OpenAPI specification
│   ├── db/
│   │   └── schema/      # Drizzle schema definitions
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers with Swagger docs
│   ├── services/        # Business logic layer
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utilities & calculations
│   └── app.ts          # Express application entry
├── drizzle/             # Database migrations
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Google OAuth credentials
- Gmail account (for email notifications)

### 1. Clone and Install

```bash
git clone <your-repo>
cd bhaga-banti
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bhaga_banti

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### 3. Database Setup

```bash
# Create database
createdb bhaga_banti

# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Better Auth will auto-create auth tables on first run
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit:

- 🌐 API: http://localhost:3000
- 📚 API Docs: http://localhost:3000/api-docs
- 🔑 Auth: http://localhost:3000/api/auth

## 📡 API Endpoints

### Authentication (Better Auth)

| Method | Endpoint                   | Description                     |
| ------ | -------------------------- | ------------------------------- |
| POST   | `/api/auth/sign-up/email`  | Sign up with email and password |
| POST   | `/api/auth/sign-in/email`  | Sign in with email and password |
| POST   | `/api/auth/sign-in/social` | Start Google OAuth sign-in      |
| POST   | `/api/auth/sign-out`       | Sign out                        |
| GET    | `/api/auth/get-session`    | Get current session             |

### Groups

| Method | Endpoint                          | Description        |
| ------ | --------------------------------- | ------------------ |
| POST   | `/api/groups`                     | Create group       |
| GET    | `/api/groups`                     | List user's groups |
| GET    | `/api/groups/:id`                 | Get group details  |
| PUT    | `/api/groups/:id`                 | Update group       |
| DELETE | `/api/groups/:id`                 | Delete group       |
| GET    | `/api/groups/:id/members`         | List members       |
| POST   | `/api/groups/:id/members`         | Add member         |
| DELETE | `/api/groups/:id/members/:userId` | Remove member      |

### Expenses

| Method | Endpoint                       | Description         |
| ------ | ------------------------------ | ------------------- |
| POST   | `/api/expenses`                | Create expense      |
| GET    | `/api/expenses/:id`            | Get expense         |
| PUT    | `/api/expenses/:id`            | Update expense      |
| DELETE | `/api/expenses/:id`            | Delete expense      |
| GET    | `/api/expenses/group/:groupId` | List group expenses |

### Balances

| Method | Endpoint                        | Description          |
| ------ | ------------------------------- | -------------------- |
| GET    | `/api/groups/:groupId/balances` | Get balances         |
| GET    | `/api/groups/:groupId/simplify` | Get simplified debts |
| GET    | `/api/balances`                 | User's total balance |

### Settlements

| Method | Endpoint                          | Description        |
| ------ | --------------------------------- | ------------------ |
| POST   | `/api/settlements`                | Record settlement  |
| GET    | `/api/settlements/user`           | User's settlements |
| GET    | `/api/settlements/group/:groupId` | Group settlements  |
| DELETE | `/api/settlements/:id`            | Delete settlement  |

### Invites

| Method | Endpoint                       | Description     |
| ------ | ------------------------------ | --------------- |
| POST   | `/api/groups/:groupId/invites` | Create invite   |
| GET    | `/api/invites/:token`          | Validate invite |
| POST   | `/api/invites/:token/accept`   | Accept invite   |
| GET    | `/api/groups/:groupId/invites` | List invites    |
| DELETE | `/api/invites/:id`             | Revoke invite   |

## 🧮 Debt Simplification Algorithm

The app uses a **Greedy Algorithm** to minimize transactions:

1. **Calculate Net Balances** - For each member: Paid - Owes
2. **Partition** - Separate into creditors (positive) and debtors (negative)
3. **Greedy Matching** - Match largest debtor with largest creditor
4. **Result** - Minimal set of transactions

**Time Complexity**: O(n log n)  
**Example**: If Alice owes ₹800 total to Bob (₹500) and Charlie (₹300), and Bob owes Charlie ₹200, the algorithm simplifies to: Alice pays Charlie ₹800 (1 transaction instead of 3).

## 🗄️ Database Schema

### Core Tables

- `user` - Better Auth managed + custom fields (phone, language, timezone)
- `group` - Expense groups
- `group_member` - Many-to-many relationship
- `expense` - Expense records
- `expense_split` - How expenses are divided
- `settlement` - Payment records
- `invitation` - Group invite links

## 📦 Scripts

```bash
# Development
pnpm dev              # Start with hot reload (tsx watch)

# Building
pnpm build            # Compile TypeScript
pnpm start            # Run compiled code
pnpm typecheck        # TypeScript checks without emitting files
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format the repo with Prettier
pnpm format:check     # Verify formatting in CI
pnpm test             # Run Vitest (passes when no tests exist)
pnpm run check        # Full local CI suite

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Auth
pnpm auth:generate    # Generate Better Auth schema
pnpm auth:migrate     # Run Better Auth migrations
```

## ✅ CI/CD Pipeline

GitHub Actions now covers both continuous integration and continuous delivery:

- `CI` runs on pull requests and pushes to `main` and `develop`
- `CD` runs on pushes to `main` and manual dispatches
- the release flow publishes a production Docker image to `ghcr.io/<owner>/<repo>`
- an optional deploy job can trigger your hosting provider through `DEPLOY_WEBHOOK_URL`

### CI checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

### CD flow

1. Re-run the full verification suite on `main`
2. Build the backend image with the checked-in `Dockerfile`
3. Push the image to GitHub Container Registry
4. Optionally trigger a production deploy webhook

### GitHub secrets and variables

- `DEPLOY_WEBHOOK_URL`
  Optional. Use this when your hosting provider supports deploy hooks.
- `PRODUCTION_URL`
  Optional repository or environment variable used to show the live URL in GitHub deployments.

## 🚀 Deployment (Railway)

1. **Create Railway project**

   ```bash
   railway init
   ```

2. **Add PostgreSQL database**
   - Go to Railway dashboard → New → Database → PostgreSQL

3. **Add environment variables**

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   BETTER_AUTH_SECRET=your-secret
   BETTER_AUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   EMAIL_USER=...
   EMAIL_PASS=...
   ```

4. **Deploy**
   ```bash
   railway up
   ```

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Rate limiting (100 req/min general, 10 req/min auth)
- ✅ Input validation with Zod
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection
- ✅ Cookie-based sessions

## 🌍 Bilingual Support

All error messages and notifications are bilingual:

- **English**: For universal understanding
- **Odia** (ଓଡ଼ିଆ): Local language support

Example: `"Group not found / ଗ୍ରୁପ୍ ମିଳୁନାହିଁ"`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Better Auth](https://www.better-auth.com/) for authentication
- [Drizzle ORM](https://orm.drizzle.team/) for database
- [Splitwise](https://www.splitwise.com/) for inspiration
- The Odia community for language support

---

Made with ❤️ in Odisha, India

**Bhaga-Banti** - ଭଲ ଭାବରେ ଅଂଶୀଦାର କରନ୍ତୁ (Share well!)
