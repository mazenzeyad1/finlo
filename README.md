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
├─ backend/
│  ├─ src/
│  │  ├─ auth/                 JWT authentication, email verification
│  │  │  ├─ auth.controller.ts  Registration, login, verification endpoints
│  │  │  ├─ auth.service.ts     Business logic, token generation, email sending
│  │  │  ├─ jwt.strategy.ts     Passport JWT strategy
│  │  │  └─ dto/                Request/response DTOs
│  │  ├─ accounts/              Account management (CRUD)
│  │  ├─ transactions/          Transaction history queries with filters
│  │  ├─ connections/           Bank linking via Flinks
│  │  ├─ budgets/               Budget tracking
│  │  ├─ rules/                 Transaction categorization rules
│  │  ├─ common/                Shared services
│  │  │  ├─ prisma.service.ts   Database connection
│  │  │  └─ mailer.service.ts   Email sending (Brevo SMTP)
│  │  ├─ providers/
│  │  │  ├─ flinks/             Flinks API adapter
│  │  │  └─ ports/              Provider interface definitions
│  │  ├─ observability/         Logging interceptor
│  │  └─ webhooks/              Flinks webhook handlers
│  └─ prisma/
│     ├─ schema.prisma          Data model (User, Account, Transaction, EmailToken, etc.)
│     ├─ migrations/            Database migrations
│     └─ seed.ts                Demo data seeding (demo@finlo.local)
├─ frontend/
│  ├─ src/app/
│  │  ├─ app.component.ts       Root layout with sidebar + header
│  │  ├─ features/
│  │  │  ├─ auth/               Sign in, sign up, verify, forgot/reset password pages
│  │  │  ├─ dashboard/          KPIs and account overview
│  │  │  ├─ accounts/           Account list and details
│  │  │  ├─ transactions/       Transaction history with filters
│  │  │  ├─ connections/        Bank linking UI with Flinks iframe modal
│  │  │  ├─ budgets/            Budget management
│  │  │  └─ api/                HTTP service layer (AuthApi, AccountApi, etc.)
│  │  ├─ shared/
│  │  │  ├─ components/         Reusable UI components
│  │  │  │  ├─ verification-banner.component.ts  Email verification prompt
│  │  │  │  └─ money.component.ts                Currency display
│  │  │  └─ models/             TypeScript interfaces
│  │  └─ state/                 Signal-based stores
│  │     ├─ auth.store.ts       Authentication state (localStorage: finlo.auth.session)
│  │     └─ app.store.ts        App-level state (accounts, selected account)
│  └─ src/styles.css            Global styles and design tokens
├─ docker-compose.yml           Multi-container orchestration
│  ├─ db (PostgreSQL 16)        Port 5433, database: finlo
│  ├─ backend (NestJS)          Port 3000, runs migrations + seed on startup
│  ├─ frontend (Angular/Vite)   Port 4200
│  └─ mailhog                   Port 8025 (UI), 1025 (SMTP)
├─ package.json                 Workspace root scripts
├─ EMAIL_SETUP.md               SMTP configuration guide (Gmail, SendGrid, Brevo)
└─ FLINKS_INTEGRATION.md        Flinks setup instructions
```

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
FLINKS_CONNECT_URL=https://toolbox.flinks.com/v3

# For production, add:
# FLINKS_CLIENT_ID=your-client-id
# FLINKS_SECRET=your-secret
```

> **Sandbox:** No credentials needed! Use institution "FlinksCapital" with username/password "Greatday"  
> **Production:** See `FLINKS_INTEGRATION.md` for setup instructions.

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
3. In the modal, select **"FlinksCapital"** institution
4. Use credentials: Username `Greatday`, Password `Greatday`
5. Complete the flow - your accounts will appear on the Accounts page

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
3. A modal opens with Flinks Connect iframe
4. Select institution **"FlinksCapital"**
5. Enter username `Greatday` and password `Greatday`
6. Complete the flow
7. Check the **Accounts** page - you should see new accounts
8. Check **Transactions** page - you should see transaction history

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

## 🙏 Acknowledgments

- **Flinks** for bank data aggregation API
- **Brevo** (formerly Sendinblue) for SMTP email delivery
- **MailHog** for local email testing
- Built with **NestJS**, **Angular**, and **Prisma**
