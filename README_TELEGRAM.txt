EXCHANGE DZ - Telegram notifications

What this package adds:
- Telegram notification when a customer order is successfully saved.
- Telegram notification when an admin changes an order status.
- Bot token remains server-side in Vercel environment variables.
- Notification contains reference, operation, amounts and status only; it does not include customer email, BaridiMob RIP, RedotPay UID, or proof image.

Vercel environment variables required:
TELEGRAM_BOT_TOKEN = your CURRENT bot token from BotFather (do not use a token that was shared in a chat)
TELEGRAM_CHAT_ID = 8996104688

Install/update on GitHub:
1. Extract this ZIP.
2. Replace the repository's index.html with this package's index.html.
3. Upload the api folder, including api/telegram-notify.js, to the root of the same GitHub repository.
4. Keep vercel.json and SUPABASE_TRACKING_SETUP.sql as they are.
5. Commit changes and wait for Vercel deployment to finish.

Important:
- The function currently accepts browser requests only from https://exchangedz.vercel.app. If you use a different production domain, update the allowed origin in api/telegram-notify.js before deploying.
- Confirm TELEGRAM_BOT_TOKEN in Vercel is a newly generated token. The token previously pasted into chat should be revoked in BotFather.
- Do not put the token in index.html, GitHub, or messages.
- Notifications are best-effort: a Telegram outage will not cancel an order that was successfully saved.
