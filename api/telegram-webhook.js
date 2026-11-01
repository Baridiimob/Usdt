const crypto = require('crypto');
const SUPABASE = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const j = await r.json(); if (!r.ok || !j.ok) throw new Error('Telegram API error'); return j.result;
}
async function db(path, options={}) {
  const r=await fetch(`${SUPABASE()}/rest/v1/${path}`,{...options,headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:options.prefer||'return=representation',...(options.headers||{})}});
  const t=await r.text(); if(!r.ok) throw new Error(`Database error ${r.status}`); return t?JSON.parse(t):null;
}
const labels={pending:'قيد المراجعة',approved:'مقبول',completed:'مكتمل',rejected:'مرفوض'};
function keyboard(o){return {inline_keyboard:[[{text:'قبول',callback_data:`st:${o.id}:approved`},{text:'إكمال',callback_data:`st:${o.id}:completed`}],[{text:'رفض',callback_data:`st:${o.id}:rejected`}]]};}
async function send(chat,text,reply_markup){return tg('sendMessage',{chat_id:chat,text, ...(reply_markup?{reply_markup}:{})});}
module.exports=async function(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
 if(!secret || req.headers['x-telegram-bot-api-secret-token']!==secret)return res.status(401).json({error:'Unauthorized'});
 if(!process.env.TELEGRAM_BOT_TOKEN||!process.env.TELEGRAM_CHAT_ID||!process.env.SUPABASE_SERVICE_ROLE_KEY||!SUPABASE())return res.status(500).json({error:'Missing server configuration'});
 const update=req.body||{}; const msg=update.message||update.callback_query?.message; const from=update.message?.from||update.callback_query?.from;
 const chatId=String(msg?.chat?.id||''); const adminChat=String(process.env.TELEGRAM_CHAT_ID);
 if(!from||chatId!==adminChat||String(from.id)!==adminChat){if(update.callback_query?.id)await tg('answerCallbackQuery',{callback_query_id:update.callback_query.id,text:'غير مصرح'}).catch(()=>{});return res.status(200).json({ok:true});}
 try{
  if(update.callback_query){const q=update.callback_query;const m=/^st:([0-9a-f-]{36}):(approved|completed|rejected)$/.exec(q.data||'');if(!m){await tg('answerCallbackQuery',{callback_query_id:q.id,text:'طلب غير صالح'});return res.status(200).json({ok:true});}
   const rows=await db(`orders?id=eq.${m[1]}&select=id,reference,status` ,{method:'PATCH',body:JSON.stringify({status:m[2],updated_at:new Date().toISOString()}),prefer:'return=representation'});
   await tg('answerCallbackQuery',{callback_query_id:q.id,text:'تم تحديث الحالة'});
   if(rows?.[0])await tg('editMessageText',{chat_id:chatId,message_id:q.message.message_id,text:`تم تحديث الطلب ${rows[0].reference}\nالحالة: ${labels[m[2]]}`});
   return res.status(200).json({ok:true});
  }
  const text=String(update.message?.text||'').trim(); const parts=text.split(/\s+/); const cmd=(parts[0]||'').split('@')[0].toLowerCase();
  if(['/start','/help'].includes(cmd)){await send(chatId,'لوحة تحكم EXCHANGE DZ\n/orders — الطلبات الجديدة\n/stats — الإحصائيات\n/rate — عرض السعر\n/rate 245 — تغيير السعر\n/pause — إيقاف استقبال الطلبات\n/resume — تشغيل استقبال الطلبات');}
  else if(cmd==='/orders'){const rows=await db('orders?status=eq.pending&select=id,reference,operation,amount_usdt,amount_dzd,created_at&order=created_at.desc&limit=8');if(!rows.length)await send(chatId,'لا توجد طلبات جديدة.');for(const o of rows)await send(chatId,`طلب جديد: ${o.reference}\nالعملية: ${o.operation==='buy'?'شراء':'بيع'} USDT\nالمبلغ: ${o.amount_usdt} USDT\nالمقابل: ${o.amount_dzd} DZD`,keyboard(o));}
  else if(cmd==='/stats'){const rows=await db('orders?select=status,amount_usdt,amount_dzd');const c=s=>rows.filter(x=>x.status===s).length;const volume=rows.filter(x=>x.status==='completed').reduce((a,x)=>a+Number(x.amount_usdt||0),0);await send(chatId,`إحصائيات EXCHANGE DZ\nإجمالي الطلبات: ${rows.length}\nقيد المراجعة: ${c('pending')}\nمقبولة: ${c('approved')}\nمكتملة: ${c('completed')}\nمرفوضة: ${c('rejected')}\nحجم USDT للطلبات المكتملة: ${volume.toFixed(2)} USDT`);}
  else if(cmd==='/rate'&&parts.length===1){const a=await db('exchange_settings?id=eq.true&select=usdt_rate,orders_enabled');await send(chatId,`السعر الحالي: ${a?.[0]?.usdt_rate||240} DZD لكل 1 USDT\nاستقبال الطلبات: ${a?.[0]?.orders_enabled?'مفعّل':'متوقف'}`);}
  else if(cmd==='/rate'){const rate=Number(parts[1]);if(!Number.isFinite(rate)||rate<1||rate>100000)await send(chatId,'اكتب سعرًا صحيحًا، مثال: /rate 245');else{await db('exchange_settings?id=eq.true',{method:'PATCH',body:JSON.stringify({usdt_rate:rate,updated_at:new Date().toISOString()})});await send(chatId,`تم تحديث السعر إلى ${rate} DZD لكل USDT.`);}}
  else if(cmd==='/pause'||cmd==='/resume'){const enabled=cmd==='/resume';await db('exchange_settings?id=eq.true',{method:'PATCH',body:JSON.stringify({orders_enabled:enabled,updated_at:new Date().toISOString()})});await send(chatId,enabled?'تم تفعيل استقبال الطلبات.':'تم إيقاف استقبال الطلبات مؤقتًا.');}
  else await send(chatId,'أمر غير معروف. أرسل /help لعرض الأوامر.');
  return res.status(200).json({ok:true});
 }catch(e){return res.status(500).json({error:'Webhook processing failed'});}
};
