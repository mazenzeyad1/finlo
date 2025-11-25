# Finlo - Personal Finance App

A full-stack personal finance application for managing bank connections, tracking transactions, and monitoring account balances. Built with modern TypeScript frameworks and integrated with Flinks for bank data aggregation.

## 🚀 Tech Stack

- **Backend:** NestJS 10, Prisma 5 ORM, PostgreSQL 16
- **Frontend:** Angular 18 (standalone components), Vite 5, Signals-based state management
- **Authentication:** JWT with refresh tokens, email verification, password reset
- **Email:** Brevo SMTP (production) or MailHog (development)
- **Banking:** Flinks Connect API (sandbox & production modes)
- **Infrastructure:** Docker Compose, npm workspaces

## ✨ Features

✅ **Complete Authentication Flow**
- User registration with email verification
- Email verification with secure bcrypt-hashed tokens (24h TTL)
- Password reset functionality
- JWT access + refresh token rotation
- Session management with automatic refresh
- 5-minute cooldown on resend verification

✅ **Bank Account Integration**
- Flinks Connect integration with iframe modal
- Real-time account syncing
- Transaction history fetching
- Multi-institution support
- Sandbox mode for testing (no credentials required)

✅ **User Experience**
- Auto-refresh verification status (10s polling for unverified users)
- Verification banner with resend functionality
- Real-time feedback on all actions
- Responsive dashboard with KPIs
- Dark-themed modern UI

✅ **Developer Experience**
- Hot reload for frontend and backend
- Docker Compose for one-command setup
- Comprehensive error handling
- TypeScript throughout
- Database migrations with Prisma

---

## 📁 Repository Structure

```
finlo/
├─ backend/                                          NestJS backend application
│  ├─ src/
│  │  ├─ auth/                                       JWT authentication & email verification
│  │  │  ├─ auth.controller.ts                       Endpoints: register, signin, verify, forgot, reset
│  │  │  ├─ auth.service.ts                          Business logic: token generation, email sending
│  │  │  ├─ jwt.strategy.ts                          Passport JWT strategy for protected routes
│  │  │  ├─ jwt-auth.guard.ts                        Guard to protect routes with @UseGuards(JwtAuthGuard)
│  │  │  └─ dto/                                     Request/response DTOs (validation)
│  │  ├─ accounts/                                   Account management CRUD
│  │  │  ├─ accounts.controller.ts                   GET /api/accounts - list user accounts
│  │  │  └─ accounts.service.ts                      Database queries for accounts
│  │  ├─ transactions/                               Transaction history queries
│  │  │  ├─ transactions.controller.ts               GET /api/transactions - paginated list
│  │  │  └─ transactions.service.ts                  Filters, search, pagination
│  │  ├─ connections/                                Bank connection management
│  │  │  ├─ connections.controller.ts                POST /link/start, POST /link/exchange
│  │  │  └─ connections.service.ts                   Orchestrates provider calls, DB writes
│  │  ├─ budgets/                                    Budget tracking CRUD
│  │  ├─ rules/                                      Transaction categorization rules
│  │  ├─ common/                                     Shared services
│  │  │  ├─ prisma.service.ts                        Database connection lifecycle
│  │  │  └─ mailer.service.ts                        SMTP email sending (Brevo/MailHog)
│  │  ├─ providers/                                  Banking data provider abstraction
│  │  │  ├─ flinks/
│  │  │  │  └─ flinks.adapter.ts                     Flinks API integration (accounts, transactions)
│  │  │  └─ ports/
│  │  │     └─ bank-data.provider.ts                 Interface all providers must implement
│  │  ├─ observability/
│  │  │  └─ logger.interceptor.ts                    HTTP request/response logging
│  │  └─ webhooks/
│  │     └─ webhooks.controller.ts                   POST /webhooks/flinks - handle Flinks events
│  └─ prisma/
│     ├─ schema.prisma                               Data model: User, Account, Transaction, etc.
│     ├─ migrations/                                 Database schema versions
│     └─ seed.ts                                     Demo user: demo@finlo.local
│
├─ frontend/                                         Angular 18 frontend (standalone components)
│  ├─ src/app/
│  │  ├─ app.component.ts                            Root layout: sidebar + header + router-outlet
│  │  ├─ app.routes.ts                               Route definitions with lazy loading
│  │  ├─ features/                                   Feature modules (pages)
│  │  │  ├─ auth/                                    Authentication pages
│  │  │  │  ├─ signin.page.ts                        Login form
│  │  │  │  ├─ signup.page.ts                        Registration form
│  │  │  │  ├─ verify.page.ts                        Email verification landing page
│  │  │  │  ├─ forgot-password.page.ts               Request reset email
│  │  │  │  └─ reset-password.page.ts                Set new password with token
│  │  │  ├─ dashboard/                               Overview with KPIs
│  │  │  │  └─ dashboard.page.ts                     Total balance, recent transactions
│  │  │  ├─ accounts/                                Account management
│  │  │  │  └─ accounts.page.ts                      List all linked accounts
│  │  │  ├─ transactions/                            Transaction history
│  │  │  │  └─ transactions.page.ts                  List with search, filters, pagination
│  │  │  ├─ connections/                             Bank linking UI
│  │  │  │  └─ connections.page.ts                   Shows connections, opens Flinks modal
│  │  │  ├─ budgets/                                 Budget management
│  │  │  └─ api/                                     HTTP service layer
│  │  │     ├─ auth.api.ts                           AuthApi: signin, signup, verify, etc.
│  │  │     ├─ account.api.ts                        AccountApi: list accounts
│  │  │     ├─ transaction.api.ts                    TransactionApi: list transactions
│  │  │     └─ connection.api.ts                     ConnectionApi: startLink, exchange
│  │  ├─ shared/                                     Reusable components & models
│  │  │  ├─ components/
│  │  │  │  ├─ verification-banner.component.ts      Email verification prompt (auto-refresh)
│  │  │  │  ├─ flinks-connect-button.component.ts    Flinks iframe modal (postMessage handler)
│  │  │  │  └─ money.component.ts                    Currency display component
│  │  │  └─ models/
│  │  │     └─ types.ts                              TypeScript interfaces (User, Account, etc.)
│  │  ├─ state/                                      Signal-based stores (no NgRx)
│  │  │  ├─ auth.store.ts                            Authentication state (localStorage sync)
│  │  │  └─ app.store.ts                             App-level state (accounts, selected account)
│  │  └─ environments/
│  │     └─ environment.ts                           Config: FLINKS_CONNECT_URL (iframe URL)
│  └─ src/styles.css                                 Global CSS: design tokens, dark theme
│
├─ docker-compose.yml                                Multi-container orchestration
│  ├─ db                                             PostgreSQL 16 (port 5433)
│  ├─ backend                                        NestJS (port 3000, runs migrations on start)
│  ├─ frontend                                       Angular/Vite (port 4200)
│  └─ mailhog                                        Email testing (UI: 8025, SMTP: 1025)
│
├─ package.json                                      Workspace root: dev, build scripts
├─ EMAIL_SETUP.md                                    SMTP configuration guide
└─ FLINKS_INTEGRATION.md                             Flinks API setup instructions
```

## 🔍 Key File Descriptions

### Backend Core Files

**`backend/src/main.ts`**
- Application entry point
- Configures CORS, global validation pipes, Swagger docs
- Starts NestJS server on port 3000

**`backend/src/app.module.ts`**
- Root module that imports all feature modules
- Configures Prisma, JWT, ConfigModule

**`backend/src/common/prisma.service.ts`**
- Manages PostgreSQL connection via Prisma Client
- Handles connection lifecycle (onModuleInit, onModuleDestroy)

**`backend/src/common/mailer.service.ts`**
- Sends emails via SMTP (Brevo in production, MailHog in dev)
- Used for verification emails, password resets

**`backend/src/providers/flinks/flinks.adapter.ts`**
- **Purpose:** Integrate with Flinks API for bank data
- **Key Methods:**
  - `getLinkToken()` - Returns iframe URL for frontend
  - `exchangeLoginId()` - Exchanges LoginId for institution data
  - `fetchAccounts()` - Retrieves account balances
  - `fetchTransactions()` - Retrieves transaction history
- **Environment:** Uses FLINKS_* env vars from backend/.env

### Frontend Core Files

**`frontend/src/app/app.component.ts`**
- Root component with sidebar, header, verification banner
- Handles user authentication state and navigation

**`frontend/src/environments/environment.ts`**
- **Purpose:** Configuration for frontend
- **Key Values:**
  - `FLINKS_CONNECT_URL` - Hardcoded Flinks iframe URL (`https://toolbox-iframe.private.fin.ag/v2/?demo=true`)
  - `FLINKS_ORIGIN` - Expected origin for postMessage validation

**`frontend/src/app/shared/components/flinks-connect-button.component.ts`**
- **Purpose:** Flinks Connect modal with iframe
- **Flow:**
  1. Opens modal with iframe (URL from environment.ts)
  2. Listens for postMessage from Flinks iframe
  3. Receives LoginId after user authenticates
  4. Sends LoginId to backend via `/api/connections/link/exchange`
  5. Backend creates Connection and fetches accounts/transactions
  6. Modal closes, emits 'connected' event to parent
- **Key Methods:**
  - `open()` - Opens modal, prepares iframe URL
  - `onMessage()` - Handles postMessage from Flinks
  - `handleLoginId()` - Exchanges LoginId with backend

**`frontend/src/app/state/auth.store.ts`**
- Signal-based authentication state
- Syncs to localStorage (key: `finlo.auth.session`)
- Used by `@if (authStore.user())` in templates

### Database Schema

**`backend/prisma/schema.prisma`**
- **User** - User accounts (email, password hash, verification status)
- **EmailToken** - Hashed verification tokens (24h TTL)
- **EmailLog** - Tracks email sends (enforces 5min cooldown)
- **RefreshToken** - JWT refresh tokens (30 day TTL)
- **Institution** - Bank institutions (e.g., "FlinksCapital")
- **Connection** - User's bank connections (links to Institution, stores LoginId)
- **Account** - Bank accounts (balance, type, externalId from Flinks)
- **Transaction** - Transaction history (amount, date, description)
- **Budget** - User-defined budgets

---

## ⚙️ Requirements

- **Docker Desktop** (recommended) or local PostgreSQL 16+
- **Node.js 20+** and npm 10+
- **PowerShell 5.1+** / bash / zsh

---

## 🏃 Quick Start

### Option 1: Docker Compose (Recommended)

```powershell
# 1. Install dependencies
npm install

# 2. Copy environment file
Copy-Item backend/.env.example backend/.env

# 3. Start all services
docker compose up --build
```

That's it! The application will be available at:
- 🌐 **Frontend:** http://localhost:4200
- 🔌 **Backend API:** http://localhost:3000
- 📧 **MailHog (email testing):** http://localhost:8025
- 💾 **Database:** postgres://postgres:postgres@localhost:5433/finlo

### Option 2: Local Development (without Docker)

```powershell
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (or use Docker for DB only)
docker run --name finlo-db -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finlo -d postgres:16

# 3. Copy and configure environment
Copy-Item backend/.env.example backend/.env
# Edit backend/.env with your configuration

# 4. Run migrations
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate

# 5. Seed database (optional)
npm --workspace backend run prisma:seed

# 6. Start backend and frontend (separate terminals)
npm --workspace backend run start:dev
npm --workspace frontend start -- --host

# Or use convenience script (runs both)
npm run dev -- --host
```

---

## 🔧 Environment Configuration

Edit `backend/.env` with your settings:

### Database
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/finlo?schema=public
```

### Authentication
```env
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_MS=2592000000  # 30 days
APP_URL=http://localhost:4200
EMAIL_TOKEN_TTL_MS=86400000     # 24 hours
RESET_TOKEN_TTL_MS=3600000      # 1 hour
```

### SMTP Email (Brevo recommended)
```env
MAIL_FROM_NAME=Finlo
MAIL_FROM_ADDRESS=no-reply@finlo.ca
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-login@example.com
SMTP_PASSWORD=your-brevo-smtp-key
```

> **Development:** Emails automatically go to MailHog at http://localhost:8025 - no SMTP setup needed!  
> **Production:** Sign up at [Brevo](https://www.brevo.com/) for free SMTP. See `EMAIL_SETUP.md` for detailed setup.

### Flinks Banking Integration
```env
FLINKS_MODE=sandbox
FLINKS_BASE_URL=https://toolbox-api.private.fin.ag/v3
FLINKS_CONNECT_URL=https://toolbox-iframe.private.fin.ag/v2/
FLINKS_CUSTOMER_ID=your-customer-id
FLINKS_BEARER_TOKEN=your-bearer-token
FLINKS_AUTH_KEY=your-auth-key
FLINKS_API_KEY=your-api-key
```

> **Sandbox:** Use institution "FlinksCapital" with username/password "Greatday"  
> **Production:** See `FLINKS_INTEGRATION.md` for setup instructions.

**Flinks Flow:**
1. User clicks "Connect Bank" → modal opens with iframe URL from `environment.ts`
2. User authenticates inside Flinks iframe (hardcoded URL: `https://toolbox-iframe.private.fin.ag/v2/?demo=true`)
3. Flinks posts LoginId via `window.postMessage` back to the component
4. Component sends LoginId to backend `/api/connections/link/exchange`
5. Backend exchanges LoginId with Flinks API for institution data
6. Backend creates Connection, fetches accounts & transactions, stores in database
7. Modal closes and parent component refreshes data

---

## 📖 User Guide

### 1. Create an Account

1. Navigate to http://localhost:4200
2. Click **Sign up** from the homepage or auth menu
3. Fill in your details (name, email, password)
4. You'll be logged in and see a verification banner

### 2. Verify Your Email

**Development (MailHog):**
1. Open http://localhost:8025
2. Find your verification email
3. Click the verification link
4. You'll be redirected and automatically verified

**Production (Real SMTP):**
1. Check your inbox for the verification email
2. Click the link to verify
3. The app will auto-refresh your verification status

**Resend Email:**
- Click "Resend email" in the verification banner
- 60-second cooldown after successful send
- Backend enforces 5-minute cooldown to prevent abuse

### 3. Link a Bank Account

1. Go to the **Connections** page
2. Click **"Link Bank (Flinks)"**
3. A modal opens with the Flinks Connect iframe
4. Select institution **"FlinksCapital"**
5. Use credentials: Username `Greatday`, Password `Greatday`
6. After successful authentication, Flinks posts a LoginId back to the page
7. The modal automatically closes and exchanges the LoginId with the backend
8. Your accounts and transactions will appear on the Accounts page

**Behind the scenes:**
- Frontend: Embeds iframe URL from `environment.ts` (`https://toolbox-iframe.private.fin.ag/v2/?demo=true`)
- Flinks: User authenticates, posts LoginId via `postMessage`
- Frontend: Sends LoginId to `/api/connections/link/exchange`
- Backend: Calls Flinks `/AccountsSummary` API to exchange LoginId
- Backend: Calls Flinks `/AccountsDetail` API to fetch accounts & transactions
- Backend: Stores Connection, Accounts, and Transactions in database

### 4. View Your Data

- **Dashboard:** See total balance across all accounts and quick overview
- **Accounts:** View all linked accounts with balances
- **Transactions:** Browse transaction history with search and filters
- **Budgets:** Create and track spending budgets

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account (alias: `/auth/signup`)
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (auto-refresh verification status)
- `POST /api/auth/verify` - Verify email with uid + token
- `GET /api/auth/verify-email?token=` - Alternative verification (token only)
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot` - Request password reset email
- `POST /api/auth/reset` - Reset password with token
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/sessions/:id` - Revoke a session

### Bank Data
- `GET /api/accounts?userId=` - List accounts
- `GET /api/transactions?userId=&page=&pageSize=` - List transactions with pagination
- `GET /api/connections?userId=` - List bank connections
- `POST /api/connections/link/start` - Get Flinks Connect URL
- `POST /api/connections/link/exchange` - Exchange Flinks LoginId for connection
- `GET /api/budgets?userId=` - List budgets

All protected endpoints require `Authorization: Bearer <access_token>` header.

---

## 🛠️ Development Commands

### Backend
```powershell
npm --workspace backend run start:dev    # Start with hot reload
npm --workspace backend run build        # Build for production
npm --workspace backend run lint         # Run ESLint
npm --workspace backend run test         # Run tests

# Prisma commands
npm --workspace backend run prisma:generate  # Generate Prisma client
npm --workspace backend run prisma:migrate   # Run migrations
npm --workspace backend run prisma:seed      # Seed database
npm --workspace backend run prisma:studio    # Open Prisma Studio

# Email testing
npm --workspace backend run mail:test "your@email.com"  # Send test email
```

### Frontend
```powershell
npm --workspace frontend start           # Start dev server
npm --workspace frontend run build       # Build for production
npm --workspace frontend run preview     # Preview production build
```

### Docker
```powershell
docker compose up --build                # Build and start all services
docker compose up -d                     # Start in background
docker compose down                      # Stop services
docker compose down -v                   # Stop and remove volumes (clears DB)
docker compose logs -f backend           # Tail backend logs
docker compose logs -f frontend          # Tail frontend logs
docker compose restart backend           # Restart backend only
docker compose build --no-cache backend  # Rebuild backend image
```

---

## 🧪 Testing the Application

### Email Verification Flow

1. Start the stack: `docker compose up --build`
2. Sign up with a new account at http://localhost:4200
3. Check MailHog at http://localhost:8025 for the verification email
4. Click the verification link in the email
5. Observe the verification banner disappears automatically
6. Try signing out and back in - notice the "Verify your email" status

### Bank Connection Flow

1. Navigate to **Connections** page
2. Click **"Link Bank (Flinks)"**
3. A modal opens with Flinks Connect iframe (URL from `frontend/src/environments/environment.ts`)
4. Select institution **"FlinksCapital"**
5. Enter username `Greatday` and password `Greatday`
6. Complete authentication - Flinks posts LoginId back to parent window
7. Modal closes automatically and sends LoginId to backend
8. Backend exchanges LoginId with Flinks API and creates database records
9. Check the **Accounts** page - you should see new accounts
10. Check **Transactions** page - you should see transaction history

**Files Involved:**
- `frontend/src/environments/environment.ts` - Hardcoded iframe URL
- `frontend/src/app/shared/components/flinks-connect-button.component.ts` - Modal & postMessage handler
- `backend/src/connections/connections.controller.ts` - `/link/exchange` endpoint
- `backend/src/providers/flinks/flinks.adapter.ts` - Flinks API integration

### Password Reset Flow

1. Click **"Forgot password?"** on sign-in page
2. Enter your email address
3. Check MailHog for the reset email
4. Click the reset link
5. Enter your new password
6. Sign in with the new password

---

## 📝 Database Schema

Key models in `backend/prisma/schema.prisma`:

- **User** - User accounts with email, password hash, verification status
- **EmailToken** - Hashed verification tokens with 24h expiry
- **EmailLog** - Email send tracking for cooldown enforcement
- **RefreshToken** - JWT refresh tokens with device info
- **Institution** - Bank institutions (Flinks)
- **Connection** - User's bank connections
- **Account** - Bank accounts with balances
- **Transaction** - Transaction history
- **Budget** - User-defined budgets

Relationships: `User -> Connection -> Account -> Transaction`

---

## 🔐 Security Features

- Passwords hashed with bcrypt (10 rounds)
- Email verification tokens hashed with bcrypt
- JWT access tokens (15min) + refresh tokens (30 days)
- Refresh token rotation on every use
- Session tracking with device fingerprinting
- 5-minute cooldown on verification email resends
- CORS configured for frontend origin
- SQL injection protection via Prisma ORM
- Rate limiting on auth endpoints

---

## 🚀 Deployment

### Docker Production Build

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
CMD ["node", "dist/main.js"]
```

### Environment Variables for Production

Update `backend/.env` for production:

```env
# Use strong secrets
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# Production database
DATABASE_URL=postgresql://user:pass@your-db-host:5432/finlo?schema=public

# Production URL
APP_URL=https://your-domain.com

# Real SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_USER=your-brevo-email
SMTP_PASSWORD=your-brevo-key
MAIL_FROM_ADDRESS=no-reply@your-domain.com

# Production Flinks
FLINKS_MODE=production
FLINKS_CLIENT_ID=your-client-id
FLINKS_SECRET=your-secret
FLINKS_BASE_URL=https://api.flinks.io/v3
FLINKS_CONNECT_URL=https://connect.flinks.io/v3
```

---

## 🐛 Troubleshooting

### Backend won't start
- **Error:** `the database system is not yet accepting connections`
  - **Fix:** Wait 5-10 seconds for PostgreSQL to fully start, then restart backend

- **Error:** `P1001: Can't reach database server`
  - **Fix:** Ensure PostgreSQL is running: `docker compose ps`
  - Check `DATABASE_URL` matches your setup

### Emails not sending
- **Development:** Check MailHog at http://localhost:8025
- **Production:** 
  - Verify SMTP credentials in `.env`
  - Check backend logs: `docker compose logs backend`
  - Test with: `npm --workspace backend run mail:test "your@email.com"`

### Verification link not working
- Ensure `APP_URL` in backend `.env` matches your frontend URL
- Check that verification links point to `/verify?uid=...&token=...`
- Tokens expire after 24 hours - resend if needed

### Flinks connection fails
- **Sandbox:** Use institution "FlinksCapital", credentials "Greatday"/"Greatday"
- **Production:** Verify `FLINKS_CLIENT_ID` and `FLINKS_SECRET` are set
- Check backend logs for Flinks API errors

### Port conflicts
- Database uses port **5433** (not 5432) to avoid conflicts
- Frontend uses port **4200**
- Backend uses port **3000**
- MailHog uses ports **8025** (UI) and **1025** (SMTP)

### Frontend not updating
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear localStorage: Open DevTools > Application > Storage > Clear site data
- Rebuild container: `docker compose build --no-cache frontend`

---

## 📚 Additional Resources

- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Detailed SMTP configuration guide
- [FLINKS_INTEGRATION.md](./FLINKS_INTEGRATION.md) - Flinks integration guide
- [Flinks API Docs](https://developer.flinks.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Documentation](https://angular.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 How Flinks Integration Works

### Architecture Overview

The Flinks integration uses an **iframe-based flow** where users authenticate directly with their bank inside a Flinks-hosted widget:

```
┌─────────────┐                    ┌──────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend    │                    │   Flinks    │
│   (Angular) │                    │   (NestJS)   │                    │   API       │
└─────────────┘                    └──────────────┘                    └─────────────┘
       │                                   │                                   │
       │ 1. User clicks "Connect Bank"    │                                   │
       │────────────────────────────────>  │                                   │
       │                                   │                                   │
       │ 2. Opens modal with iframe       │                                   │
       │    (URL from environment.ts)     │                                   │
       │    https://toolbox-iframe...     │                                   │
       │    /v2/?demo=true               │                                   │
       │                                   │                                   │
       │                                   │                                   │
       │ 3. User authenticates inside     │                                   │
       │    Flinks iframe (selects bank,  │                                   │
       │    enters credentials)            │                                   │
       │                                   │                                   │
       │ <────────────────────────────────────────────────────────────────── │
       │    4. Flinks posts LoginId via window.postMessage                  │
       │                                   │                                   │
       │ 5. POST /api/connections         │                                   │
       │    /link/exchange                 │                                   │
       │    { userId, loginId }            │                                   │
       │─────────────────────────────────> │                                   │
       │                                   │ 6. POST /AccountsSummary          │
       │                                   │    { LoginId }                    │
       │                                   │─────────────────────────────────> │
       │                                   │                                   │
       │                                   │ <─────────────────────────────── │
       │                                   │    { Institution, ... }           │
       │                                   │                                   │
       │                                   │ 7. POST /AccountsDetail           │
       │                                   │    { LoginId }                    │
       │                                   │─────────────────────────────────> │
       │                                   │                                   │
       │                                   │ <─────────────────────────────── │
       │                                   │    { Accounts, Transactions }     │
       │                                   │                                   │
       │                                   │ 8. Saves to database:             │
       │                                   │    - Connection record            │
       │                                   │    - Account records              │
       │                                   │    - Transaction records          │
       │                                   │                                   │
       │ <───────────────────────────────  │                                   │
       │    9. Returns success             │                                   │
       │                                   │                                   │
       │ 10. Closes modal, refreshes data │                                   │
```

### File Responsibilities

1. **`frontend/src/environments/environment.ts`**
   - Stores hardcoded Flinks iframe URL: `https://toolbox-iframe.private.fin.ag/v2/?demo=true`
   - This URL never changes and doesn't need backend API call

2. **`frontend/src/app/shared/components/flinks-connect-button.component.ts`**
   - Renders modal with iframe pointing to URL from environment.ts
   - Listens for `window.postMessage` events from Flinks iframe
   - When LoginId arrives, sends it to backend `/api/connections/link/exchange`

3. **`backend/src/connections/connections.controller.ts`**
   - Endpoint: `POST /api/connections/link/exchange`
   - Receives `{ userId, loginId }` from frontend
   - Calls `ConnectionsService.linkAccount()`

4. **`backend/src/providers/flinks/flinks.adapter.ts`**
   - `exchangeLoginId()` - Calls Flinks `/AccountsSummary` to get institution info
   - `fetchAccounts()` - Calls Flinks `/AccountsDetail` to get account balances
   - `fetchTransactions()` - Extracts transactions from `/AccountsDetail` response
   - Uses Bearer token, API key, and auth key from `backend/.env`

5. **`backend/src/connections/connections.service.ts`**
   - Orchestrates the full flow:
     1. Exchange LoginId for institution data
     2. Create Institution record (if not exists)
     3. Create Connection record
     4. Fetch and save Accounts
     5. Fetch and save Transactions

### Environment Variables

**Backend (`backend/.env`):**
```env
FLINKS_MODE=sandbox
FLINKS_BASE_URL=https://toolbox-api.private.fin.ag/v3
FLINKS_CONNECT_URL=https://toolbox-iframe.private.fin.ag/v2/
FLINKS_CUSTOMER_ID=43387ca6-0391-4c82-857d-70d95f087ecb
FLINKS_BEARER_TOKEN=O2r9FLhO7PBqz9L
FLINKS_AUTH_KEY=c4569c54-e167-4d34-8de6-f4113bc82414
FLINKS_API_KEY=3d5266a8-b697-48d4-8de6-52e2e2662acc
```

**Frontend (`frontend/src/environments/environment.ts`):**
```typescript
export const environment = {
  FLINKS_CONNECT_URL: 'https://toolbox-iframe.private.fin.ag/v2/?demo=true',
  FLINKS_ORIGIN: 'https://toolbox-iframe.private.fin.ag',
};
```

### Security Notes

- Frontend iframe URL is **hardcoded** and doesn't change per user
- Backend credentials (bearer token, API key) are **never exposed** to frontend
- `postMessage` origin is **validated** to prevent malicious messages
- LoginId is **single-use** and only valid for the specific authentication session

---

## 🙏 Acknowledgments

- **Flinks** for bank data aggregation API
- **Brevo** (formerly Sendinblue) for SMTP email delivery
- **MailHog** for local email testing
- Built with **NestJS**, **Angular**, and **Prisma**
