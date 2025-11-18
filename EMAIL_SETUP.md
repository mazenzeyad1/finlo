# SMTP Email Configuration Guide

Your app uses **SMTP** for all email delivery. Works with Gmail, Cloudflare Email Routing, SendGrid, Mailgun, and any SMTP provider.

## Quick Setup with Gmail (Fastest)

### Steps:

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

3. **Update `backend/.env`**:
   ```env
   MAIL_FROM_NAME=Your App
   MAIL_FROM_ADDRESS=your-email@gmail.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

4. **Restart Backend**:
   ```powershell
   docker compose restart backend
   ```

### Gmail Limitations:
- ⚠️ 500 emails/day limit
- ⚠️ Shows "via gmail.com" in recipient inbox
- ⚠️ Not ideal for production
- ✅ Perfect for development/testing
- ✅ Works immediately

---

## Production Option: SendGrid SMTP

**Recommended for production** - Free tier includes 100 emails/day, excellent deliverability.

### Setup:

1. **Sign up at [SendGrid](https://sendgrid.com/)**

2. **Create API Key**:
   - Go to Settings → API Keys → Create API Key
   - Give it "Mail Send" permissions
   - Copy the key (starts with `SG.`)

3. **Update `backend/.env`**:
   ```env
   MAIL_FROM_NAME=Your App
   MAIL_FROM_ADDRESS=verified@yourdomain.com
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.your-sendgrid-api-key
   ```

4. **Verify sender email** in SendGrid dashboard

5. **Restart Backend**:
   ```powershell
   docker compose restart backend
   ```

### SendGrid Benefits:
- ✅ Free tier: 100 emails/day forever
- ✅ Professional deliverability
- ✅ No "via" sender reputation issues
- ✅ Analytics dashboard
- ✅ Easy domain verification

---

## Alternative: Cloudflare Email Routing (FREE)

If you have a domain on Cloudflare, you can use their free email routing with any SMTP service.

### Setup:

1. **Add domain to Cloudflare** and update nameservers

2. **Enable Email Routing**:
   - Go to Email → Email Routing in Cloudflare
   - Click Enable and verify DNS records

3. **Use with Gmail/SendGrid SMTP** (Cloudflare doesn't provide SMTP sending directly)

4. **Configure your `.env`** with Gmail or SendGrid credentials as shown above

---

## Testing Your Email Setup

After configuring SMTP credentials:

```powershell
# Test sending an email
cd backend
npm run mail:test your-email@example.com

# Check backend logs for confirmation
docker compose logs backend -f
```

You should see in logs:
```
[MailerService] SMTP configured: smtp.gmail.com:587
```

If email sending fails, check:
- Gmail App Password is correct (16 characters, no spaces)
- 2FA is enabled on Gmail account
- SMTP credentials match exactly in `.env`
- Backend has been restarted after `.env` changes

---

## Current Configuration

Your backend is **already configured for SMTP** and running at:
- Backend API: `http://localhost:3000/api`
- Frontend: `http://localhost:4200`
- Flinks: Sandbox mode active

**Next step**: Update SMTP credentials in `backend/.env` to start sending real emails!
