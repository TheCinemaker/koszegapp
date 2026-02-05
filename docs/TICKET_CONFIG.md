# Ticket Configuration Guide

This document explains the centralized configuration system for the KőszegAPP ticket system.

## Overview

The ticket system uses a **centralized configuration** approach:
- **Non-secret settings** → `config/ticket-config.json`
- **Secret API keys** → Environment variables (`.env`)
- **Config loader** → `netlify/functions/lib/ticketConfig.js`

## Configuration File Structure

### `config/ticket-config.json`

```json
{
  "env": "test",                    // "test" or "production"
  
  "branding": {
    "appName": "KőszegAPP",
    "supportEmail": "info@koszegapp.hu",
    "logoUrl": "https://koszegapp.hu/logo.png"
  },
  
  "qr": {
    "tokenLength": 32,               // QR token length in bytes
    "singleUse": true                // Tickets can only be used once
  },
  
  "email": {
    "from": "KőszegAPP <onboarding@resend.dev>",
    "subjectPrefix": "[TEST]",       // Prefix for email subjects
    "sendDelayMs": 500               // Delay before sending email
  },
  
  "wallet": {
    "apple": {
      "enabled": true,
      "passNamePrefix": "TEST – ",   // Prefix for pass names
      "teamIdentifier": "XXXXXXX",
      "passTypeIdentifier": "pass.hu.koszegapp.ticket"
    }
  },
  
  "stripe": {
    "currency": "HUF",
    "successPath": "/tickets/success",
    "cancelPath": "/tickets"
  }
}
```

## Environment Variables

### `.env` (DO NOT commit to git!)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Resend
RESEND_API_KEY=re_...

# Passkit
PASSKIT_PASSPHRASE=your_passphrase

# App URL
URL=http://localhost:8888
```

## Usage in Netlify Functions

### Import the config loader

```javascript
const { ticketConfig, getStripeConfig, getEmailConfig, getWalletConfig } = require('./lib/ticketConfig');
```

### Access configuration

```javascript
// Direct config access
const qrToken = crypto.randomBytes(ticketConfig.qr.tokenLength).toString('hex');

// Helper functions
const stripeConfig = getStripeConfig();
const emailConfig = getEmailConfig();
const walletConfig = getWalletConfig();
```

### Examples

**Email subject with prefix:**
```javascript
subject: `${emailConfig.subjectPrefix} 🎟️ Jegyed: ${event.name}`
// Result: "[TEST] 🎟️ Jegyed: Kőszegi Várséta"
```

**Apple Wallet pass name:**
```javascript
description: `${walletConfig.passNamePrefix}${event.name}`
// Result: "TEST – Kőszegi Várséta"
```

**Stripe currency:**
```javascript
currency: stripeConfig.currency.toLowerCase()
// Result: "huf"
```

## Test vs Production Mode

### Switching Modes

1. **Test Mode** (default):
   ```json
   {
     "env": "test",
     "email": {
       "subjectPrefix": "[TEST]"
     },
     "wallet": {
       "apple": {
         "passNamePrefix": "TEST – "
       }
     }
   }
   ```

2. **Production Mode**:
   ```json
   {
     "env": "production",
     "email": {
       "subjectPrefix": ""
     },
     "wallet": {
       "apple": {
         "passNamePrefix": ""
       }
     }
   }
   ```

### Environment Variables for Production

```env
# Stripe (use live keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (production email)
RESEND_API_KEY=re_...

# App URL (set by Netlify)
URL=https://koszegapp.hu
```

## What Goes Where?

### ✅ Config File (`ticket-config.json`)
- Branding (app name, support email)
- QR settings (token length, single-use)
- Email settings (from address, subject prefix)
- Wallet settings (pass name prefix, identifiers)
- Stripe settings (currency, redirect paths)

### ❌ NOT in Config File
- API keys (Stripe, Resend)
- Passwords/passphrases
- Private keys or certificates
- Database credentials

### ✅ Environment Variables (`.env`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `PASSKIT_PASSPHRASE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Helper Functions

### `getAppUrl()`
Returns the full application URL (from `URL` env var or localhost).

### `isTestMode()`
Returns `true` if `env === "test"`.

### `getStripeConfig()`
Returns Stripe configuration with secrets from env vars.

### `getEmailConfig()`
Returns email configuration with API key from env vars.

### `getWalletConfig()`
Returns wallet configuration with passphrase from env vars.

## Best Practices

1. **Never commit secrets** - Use `.env` for API keys
2. **Use config for settings** - Branding, URLs, feature flags
3. **Test mode by default** - Avoid accidental production charges
4. **Clear prefixes** - Make test emails/passes obvious
5. **Centralized loader** - Import from `lib/ticketConfig.js` only

## Troubleshooting

### "Cannot find module './lib/ticketConfig'"
- Ensure `netlify/functions/lib/ticketConfig.js` exists
- Check file path is correct relative to function

### "Cannot read config file"
- Ensure `config/ticket-config.json` exists
- Check JSON syntax is valid

### "Stripe key not found"
- Check `.env` file has `STRIPE_SECRET_KEY`
- Ensure environment variables are loaded

### "Email not sending"
- Check `RESEND_API_KEY` in `.env`
- Verify `email.from` in config matches Resend domain
