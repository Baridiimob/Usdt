// Vercel serverless function. Bot token is read only from server environment variables.
module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const origin = req.headers.origin || "";
  const host = req.headers.host || "";
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch (_) {}
  // Allow the production domain and Vercel preview domains, but only when
  // the request originates from the same host serving this function.
  if (!originHost || originHost !== host) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId)
    return res.status(500).json({ error: "Telegram is not configured" });

  const body = req.body || {};
  const event = body.event;
  const reference = String(body.reference || "");
  const operation = body.operation;
  const status = body.status;
  const amountUsdt = Number(body.amount_usdt);
  const amountDzd = Number(body.amount_dzd);
  const allowedStatuses = ["pending", "approved", "completed", "rejected"];
  const statusLabels = {
    pending: "قيد المراجعة",
    approved: "مقبول",
    completed: "مكتمل",
    rejected: "مرفوض",
  };

  if (
    !["new_order", "status_changed"].includes(event) ||
    !/^EX-[A-Z0-9-]{8,40}$/i.test(reference) ||
    !["buy", "sell"].includes(operation) ||
    !allowedStatuses.includes(status) ||
    !Number.isFinite(amountUsdt) ||
    amountUsdt <= 0 ||
    !Number.isFinite(amountDzd) ||
    amountDzd <= 0
  ) {
    return res.status(400).json({ error: "Invalid notification data" });
  }

  const operationLabel = operation === "buy" ? "شراء USDT" : "بيع USDT";
  const title =
    event === "new_order"
      ? "🆕 طلب جديد في EXCHANGE DZ"
      : "🔔 تحديث حالة طلب EXCHANGE DZ";
  const message = [
    title,
    `رقم الطلب: ${reference}`,
    `العملية: ${operationLabel}`,
    `المبلغ: ${amountUsdt} USDT`,
    `المقابل: ${amountDzd} DZD`,
    `الحالة: ${statusLabels[status]}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      }
    );
    const result = await response.json();
    if (!response.ok || !result.ok)
      return res.status(502).json({ error: "Telegram send failed" });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(502).json({ error: "Telegram request failed" });
  }
};
