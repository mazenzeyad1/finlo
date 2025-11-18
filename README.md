# Finlo - Personal Finance App

A full-stack application for managing your personal finances and bank connections.

- **Backend:** NestJS 10, Prisma 5, PostgreSQL, Ports & Adapters architecture with provider stubs for Plaid/Flinks.
- **Frontend:** Angular 18 (standalone components) compiled by Vite 5 with `@analogjs/vite-plugin-angular`.
- **Dev Tooling:** npm workspaces, Docker Compose for local infrastructure, shared lint/build scripts.

The frontend ships with a styled dashboard shell (sidebar navigation, KPI cards, tables, and forms) ready to wire up to live data. The backend exposes REST endpoints and Prisma models that can be extended with real provider integrations.

---

## Repository Layout

```
fr_app/
├─ backend/
│  ├─ src/
│  │  ├─ accounts/        REST controllers + services
│  │  ├─ common/          Prisma service, shared helpers
│  │  ├─ connections/     Link/start/exchange endpoints
│  │  ├─ observability/   Logger interceptor
│  │  └─ … (auth, budgets, rules, webhooks, providers)
│  └─ prisma/
│     └─ schema.prisma    Postgres data model
├─ frontend/
│  ├─ src/app/
│  │  ├─ app.component.ts Layout shell (sidebar + topbar)
│  │  ├─ features/        Feature pages (dashboard, accounts…)
│  │  ├─ shared/          Reusable UI components
│  │  └─ state/           Signals-based app store
│  └─ src/styles.css      Global design tokens & components
├─ docker-compose.yml     DB + backend + frontend services
└─ package.json           npm workspace root scripts
```

---

## Requirements

- Docker Desktop (for the quickest start) **or** a local Postgres 15+ instance.
- Node.js 20+ and npm 10+ (the repo uses npm workspaces).
- PowerShell 5.1+/bash/zsh for the examples below.

---

## First-Time Setup

1. **Install dependencies** (runs once and installs both workspaces):
   ```powershell
   npm install
   ```

2. **Configure environment variables** for the backend:
   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```
    - Update `DATABASE_URL` if you do not plan to use the Docker Postgres container.
    - Tune auth token lifetimes with `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_MS`, `EMAIL_TOKEN_TTL_MS`, and `RESET_TOKEN_TTL_MS` (defaults cover most dev scenarios).
    - Configure `APP_URL` so verification/reset links point to the right UI host and set the human-friendly sender info with `MAIL_FROM_NAME` + `MAIL_FROM_ADDRESS`.
    - Choose your mail provider:
       - Leave `EMAIL_PROVIDER` unset to keep the built-in Nodemailer transport that talks to the local MailHog SMTP relay (perfect for development).
       - Set `EMAIL_PROVIDER=postmark` (with `POSTMARK_SERVER_TOKEN` and optional `POSTMARK_MESSAGE_STREAM`) to deliver production traffic through Postmark’s template API.
    - When using MailHog/local SMTP, keep `MAIL_HOST`, `MAIL_PORT`, and `MAIL_SECURE` aligned with the docker-compose defaults (`mailhog`, `1025`, `false`). For real SMTP credentials you can still supply `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASSWORD` if you prefer that path.
   - Add any provider credentials (Plaid/Flinks) when you integrate real APIs.

3. **Generate Prisma client & run migrations** (requires Postgres running):
   ```powershell
   npm --workspace backend run prisma:generate
   npm --workspace backend run prisma:migrate
   ```

4. (Optional) **Seed data** – preload demo accounts and transactions:
   ```powershell
   docker compose run --rm backend npx prisma db seed
   ```
   > Why the container? The seed expects to reach the database at host `db`, which is only resolvable inside the Compose network. Running it through the backend service guarantees the right hostname and credentials.
   >
   > Already running the stack with `docker compose up`? You can omit `--build`/`--rm`; the command will reuse the existing containers.
   
   The Docker workflow runs the same seed automatically so the UI always opens with example data.

---

## Running with Docker Compose

This spins up Postgres, the NestJS backend, and the Angular frontend.

```powershell
docker compose up --build
```

- Frontend UI: `http://localhost:4200/`
- Backend API: `http://localhost:3000/`
- Postgres: `postgres://postgres:postgres@localhost:5433/finlo`
The stack runs Prisma migrations and seeds a demo user (`demo-user`) with a checking account and a handful of transactions so the Transactions page mirrors the mock immediately.

> **Quick command recap**
> 1. `npm install`
> 2. `Copy-Item backend/.env.example backend/.env`
> 3. (Optional) `npm --workspace backend run prisma:generate` and `npm --workspace backend run prisma:migrate`
> 4. `docker compose up --build`
>
> Steps 1–3 are typically run once. On subsequent runs you can simply execute `docker compose up` to restart the stack.
>
> 🕑 **First boot takes ~a minute.** Postgres takes a few seconds to accept connections; if the backend exits with `the database system is not yet accepting connections`, wait a moment and rerun `docker compose up`—the next start will succeed once the DB is ready.

Useful follow-up commands:

```powershell
# Run backend linting (TypeScript ESLint)
npm --workspace backend run lint

# Send a test email using the configured SMTP transport
npm --workspace backend run mail:test "you@example.com"

# Tail logs for a specific service
docker compose logs -f frontend
docker compose logs -f backend

# Rebuild only the frontend or backend container
docker compose build --no-cache frontend
docker compose build --no-cache backend

# Stop and remove everything (including volumes)
docker compose down -v

# Shut everything down without removing volumes
docker compose down
```

> **Tip:** If you change Node dependencies, rebuild the affected service with `docker compose build --no-cache <service>`.

---

## Configure Real Email Delivery

Local development keeps working out of the box: the backend falls back to Nodemailer + MailHog whenever `EMAIL_PROVIDER` is unset, and every message appears in the inbox at `http://localhost:8025/`. When you are ready to ship, switch to Postmark (recommended) or to your own SMTP provider.

### Postmark (recommended for production)

1. **Create a Postmark server** and note the token from *Server → Credentials → Server API token*.
2. **Add a sender signature or authenticated domain** so Postmark can deliver on your behalf (e.g., `mail.yourdomain.com`). Configure SPF + DKIM records as directed in Postmark.
3. **Create two templates** using aliases the backend expects:
   - `verify-email` – include `{{user_first_name}}` and `{{verify_url}}` placeholders.
   - `reset-password` – include `{{user_first_name}}` and `{{reset_url}}` placeholders.
   A minimal verification body looks like:
   ```
   Hi {{user_first_name}},

   Please verify your email by clicking the link below:
   {{verify_url}}

   If you didn’t request this, please ignore this email.
   ```
4. **Update `backend/.env`:**
   ```
   EMAIL_PROVIDER=postmark
   POSTMARK_SERVER_TOKEN=pmkt_xxx
   POSTMARK_MESSAGE_STREAM=outbound  # optional, defaults to "outbound"
   MAIL_FROM_NAME="Your App"
   MAIL_FROM_ADDRESS="no-reply@mail.yourdomain.com"
   ```
   Leave the MailHog SMTP fields in place—if Postmark is unavailable the service still falls back to Nodemailer so you do not lose email visibility in development.
5. **Restart the backend** (`docker compose up -d --build backend`) and check logs for `Postmark` send confirmations.

### Staying on SMTP (Mailhog or another provider)

Prefer to keep SMTP? Just leave `EMAIL_PROVIDER` unset. The backend will continue using Nodemailer transports, so configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_SECURE`, `MAIL_FROM_NAME`, and `MAIL_FROM_ADDRESS` exactly as before. The `mail:test` script remains useful for smoke tests:

```powershell
npm --workspace backend run mail:test "you@example.com"
```

If you switch away from MailHog, restart the backend and watch for `Mail transport verified ...` in the logs to confirm the new credentials are valid.

---

## Feature Testing

The latest frontend + email work adds end-to-end auth flows (signup, verify, forgot/reset) that depend on the upgraded mailer. Use the checklist below to validate everything quickly in development.

### 1. Open the local mail inbox

Once the stack is running, go to `http://localhost:8025/` (MailHog UI). Every verification/reset message shows up here in development and includes the same links users receive in production.

### 2. Start the stack

```powershell
docker compose up --build
```

Wait for the backend logs to show `Mail transport verified (mailhog:1025)`.

### 3. Walk through the auth UI

1. Visit `http://localhost:4200/` and open the Auth menu.
2. Create a new account via **Sign up**. The frontend store persists the session and shows the top-bar badge once you land on the dashboard.
3. Trigger **Verify email** – open the link from MailHog (it now targets `/verify?token=...&uid=...`) and confirm the new Angular verify screen marks the account as verified.
4. Use **Forgot password** → **Reset password**; after submitting the reset form, the frontend displays a confirmation toast and clears the cached credentials.
5. Refresh the page – the auth store rehydrates from storage and keeps you signed in if the session is still valid.

### 4. Optional: send a manual test email

```powershell
npm --workspace backend run mail:test "receiver@example.com"
```

The command sends a message into MailHog; open the web UI to inspect the rendered template the frontend flows rely on.

---

## Local Development without Docker

### 1. Start Postgres

Run your own instance, or quickly start one via Docker:

```powershell
docker run --name finlo-db -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finlo -d postgres:15
```

Ensure `backend/.env` points to this database, then run the Prisma commands from the setup section.

### 2. Start the backend

```powershell
npm --workspace backend run start:dev
```

### 3. Start the frontend

```powershell
npm --workspace frontend start -- --host
```

Vite defaults to port `4200`; if it is occupied, it will auto-increment (look for the port in the terminal output). Access the UI at `http://localhost:4200/` or whichever port Vite reports.

### 4. Convenience script (runs backend & frontend together)

From the repo root:

```powershell
npm run dev -- --host
```

> ⚠️ The combined script expects Postgres to be available. Without it the NestJS app will exit with `PrismaClientInitializationError: Can't reach database server`.
> 
> If you see that error on startup, make sure either Docker Postgres is running (`docker compose up db`) or your local Postgres service is reachable, then rerun the script.

---

## Build & Deployment

- **Build both workspaces:**
  ```powershell
  npm run build
  ```
- **Frontend only:** `npm --workspace frontend run build`
- **Backend only:** `npm --workspace backend run build`
- **Preview production frontend bundle:**
  ```powershell
  npm --workspace frontend run preview
  ```

Generated frontend artifacts live under `frontend/dist/`. Backend output is emitted to `backend/dist/` by the Nest build command.

---

## UI Overview (Current State)

- **App shell:** Persistent dark sidebar, branded topbar with search + account filter, responsive layout.
- **Dashboard:** KPIs (total/average balances), account cards.
- **Accounts:** Card grid showing account metadata and balances.
- **Connections:** Table view with status pills and empty-state prompt.
- **Transactions:** Filterable table with date range, search input, and pagination controls.
- **Budgets:** Card grid, progress bars, and a styled form for adding new budgets.

All feature pages are wired to the shared store and API services; replace mocked data with live responses as your backend matures.

---

## Troubleshooting & Tips

- **Missing Angular compiler:** run `npm install` (ensures `@angular/compiler-cli` is present) before building the frontend.
- **New auth endpoints:** backend now exposes `/auth/signup`, `/auth/signin`, `/auth/refresh`, `/auth/verify`, `/auth/verify/resend`, `/auth/forgot`, `/auth/reset`, and session management via `/auth/sessions`. Use the tokens returned by sign-up/sign-in to call protected routes.
- **Lint failures about unused parameters:** prefix intentionally unused arguments with `_` (the backend ESLint config treats `_arg` as an allowed unused name) or remove them altogether.
- **Port already in use:** Vite will automatically pick the next available port; check terminal output for the actual URL.
- **Backend cannot reach Postgres (`P1001`):** confirm the database container/service is running and that `DATABASE_URL` matches your setup.
- **Prisma seed from the host keeps failing auth:** use `docker compose run --rm backend npx prisma db seed` to execute the seed inside the Compose network where the `db` hostname resolves.
- **Trigger Prisma client regeneration:** whenever you edit `schema.prisma`, run `npm --workspace backend run prisma:generate`.
- **Refresh workspace dependencies:** delete `node_modules` (and `package-lock.json` if you change versions), then re-run `npm install`.

---

## Clean Architecture Notes

- **Domain layer:** Prisma schema + TypeScript models capture core concepts (accounts, transactions, budgets).
- **Application layer:** NestJS services orchestrate domain logic and talk to provider ports.
- **Infrastructure:** Controllers, Prisma service, provider adapters (Plaid/Flinks stubs).
- **Presentation:** Angular standalone components consuming REST APIs with a shared state store.

Extend provider adapters with real integrations, secure the auth module, and enrich the UI as needed for your product.
