# Flinks Integration Guide

This app now connects to **Flinks API** in sandbox/toolbox mode for bank data aggregation.

## Sandbox Setup (No Credentials Required)

The app is configured to use Flinks Toolbox, which doesn't require API keys or customer IDs.

### Environment Configuration

Already configured in `backend/.env`:
```env
FLINKS_MODE=sandbox
FLINKS_BASE_URL=https://toolbox-api.private.fin.ag/v3
FLINKS_CONNECT_URL=https://toolbox.flinks.com/v3
```

## Testing the Integration

### 1. Start the Application

```powershell
docker compose up --build
```

This will:
- Start PostgreSQL
- Apply the Prisma migration (including removal of Plaid enum)
- Start the NestJS backend with Flinks adapter
- Start the Angular frontend
- Start MailHog for email testing

### 2. Link a Bank Account

1. Navigate to **Connections** page in the UI (`http://localhost:4200/`)
2. Click **"Link Bank (Flinks)"**
3. A modal opens with the Flinks Connect iframe
4. Use these **sandbox credentials**:
   - **Institution**: `FlinksCapital`
   - **Username**: `Greatday`
   - **Password**: `Greatday`

5. Complete the flow - the app will:
   - Receive a `LoginId` from Flinks
   - Exchange it via `/AccountsSummary` endpoint
   - Create an Institution + Connection record
   - Fetch accounts via `/AccountsDetail`
   - Store accounts in your database

### 3. View Accounts & Transactions

- **Accounts page**: Shows linked accounts with balances
- **Transactions page**: Displays transaction history from Flinks

## How It Works

### Backend Flow

1. **Start Link** (`GET /api/connections/link/start`)
   - Returns Flinks Connect URL (`https://toolbox.flinks.com/v3`)
   - Also returns sandbox credentials for convenience

2. **Exchange Token** (`POST /api/connections/link/exchange`)
   - Frontend sends `LoginId` received from Flinks iframe
   - Backend calls Flinks `/AccountsSummary` to verify
   - Creates Institution + Connection records
   - Calls `/AccountsDetail` to fetch accounts
   - Returns connection ID

3. **Fetch Data** (Background sync jobs can call these)
   - `FlinksAdapter.fetchAccounts(loginId)` - Gets all accounts
   - `FlinksAdapter.fetchTransactions(loginId)` - Gets transaction history

### Frontend Flow

1. User clicks "Link Bank"
2. Frontend fetches Connect URL from backend
3. Opens Flinks Connect in an iframe modal
4. Listens for `postMessage` events from iframe
5. When Flinks sends `loginId`, exchanges it with backend
6. Closes modal and refreshes connection list

## API Endpoints Used

All calls go to `https://toolbox-api.private.fin.ag/v3`:

- **POST /AccountsSummary** - Get institution info for a LoginId
- **POST /AccountsDetail** - Get accounts and transactions
  - Include `RequestId` for idempotency
  - Include `MostRecentCached: true` for subsequent calls

## Moving to Production

When ready to use real credentials:

1. Sign up at [Flinks](https://flinks.com/) and get your credentials
2. Update `backend/.env`:
   ```env
   FLINKS_MODE=production
   FLINKS_BASE_URL=https://api.flinks.io/v3
   FLINKS_CONNECT_URL=https://connect.flinks.io/v3
   FLINKS_CLIENT_ID=your-client-id
   FLINKS_SECRET=your-secret
   ```

3. Update `FlinksAdapter` constructor to use credentials:
   ```typescript
   const headers = {
     'Content-Type': 'application/json',
     'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`
   };
   ```

## Additional Resources

- [Flinks API Documentation](https://developer.flinks.com/)
- [Flinks Connect Guide](https://developer.flinks.com/docs/connect)
- [Sandbox Institutions](https://developer.flinks.com/docs/testing#sandbox-credentials)

## Troubleshooting

**Issue**: Modal doesn't show
- Check browser console for CORS errors
- Ensure `FLINKS_CONNECT_URL` is accessible

**Issue**: "LoginId not found"
- The LoginId expires quickly in sandbox
- Re-do the connection flow

**Issue**: No accounts returned
- Verify you used correct sandbox credentials
- Check backend logs for Flinks API errors
- Ensure `FlinksCapital` institution was selected

**Issue**: Database enum error
- Run the migration: `npm --workspace backend run prisma:migrate`
- Or reset: `docker compose down -v && docker compose up --build`
