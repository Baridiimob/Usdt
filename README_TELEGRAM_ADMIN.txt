EXCHANGE DZ - Telegram Admin Bot

New server endpoint: api/telegram-webhook.js
Commands: /start, /help, /orders, /stats, /rate, /rate 245, /pause, /resume

Required Vercel environment variables:
TELEGRAM_BOT_TOKEN (existing)
TELEGRAM_CHAT_ID (existing; must be the private admin chat ID)
TELEGRAM_WEBHOOK_SECRET (new)
SUPABASE_URL (new)
SUPABASE_SERVICE_ROLE_KEY (new; server only)

IMPORTANT: Re-run the UPDATED EXCHANGE_DZ_BOT_SETUP.sql in Supabase SQL Editor. It adds a safe public RPC for the website and does not expose the service role key.

After deploying this package, register the webhook privately using Telegram Bot API setWebhook:
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
POST JSON body:
{"url":"https://exchangedz.vercel.app/api/telegram-webhook","secret_token":"<THE_EXACT_TELEGRAM_WEBHOOK_SECRET_VALUE>"}
Do not share the token or secret in chat or put them in frontend files.

Security: webhook checks Telegram secret header and restricts commands to TELEGRAM_CHAT_ID. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code or GitHub.

Note: This package adds the backend command endpoint. The customer site must also call get_public_exchange_settings before showing the live rate and accepting orders; this frontend integration is being finalized separately. Until then /rate and /pause change database settings but may not yet change the visible customer page.
