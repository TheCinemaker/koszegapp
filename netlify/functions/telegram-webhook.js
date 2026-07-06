import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Supabase inicializálása
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const update = JSON.parse(event.body);
    console.log('[TelegramWebhook] Beérkező update:', JSON.stringify(update));

    // Csak a gombnyomásokkal (callback_query) foglalkozunk
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackQueryId = callbackQuery.id;
      const data = callbackQuery.data; // Pl: "accept_order:order-uuid-1234"
      const courierName = `${callbackQuery.from.first_name || ''} ${callbackQuery.from.last_name || ''}`.trim();
      const courierTelegramId = callbackQuery.from.id;

      if (data.startsWith('accept_order:')) {
        const orderId = data.split(':')[1];

        // 1. Lekérjük a rendelést a Supabase-ből, ellenőrizve, hogy még szabad-e
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('id, status, restaurant_name, delivery_address, total_price')
          .eq('id', orderId)
          .single();

        if (fetchError || !order) {
          console.error('[TelegramWebhook] Hiba a rendelés lekérésekor:', fetchError);
          await answerCallback(callbackQueryId, 'Hiba történt a rendelés ellenőrzésekor! ❌', true);
          return { statusCode: 200, body: 'OK' };
        }

        // 2. Ha a rendelés állapota 'ready_for_delivery' (szabad)
        if (order.status === 'ready_for_delivery') {
          
          // Frissítjük a rendelést a Supabase-ben
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'delivering', // Státusz átírása (Futár úton)
              courier_name: courierName,
              courier_telegram_id: courierTelegramId.toString()
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('[TelegramWebhook] Adatbázis frissítési hiba:', updateError);
            await answerCallback(callbackQueryId, 'Adatbázis hiba, kérlek próbáld újra! ❌', true);
            return { statusCode: 200, body: 'OK' };
          }

          // Sikeres elfogadás visszajelzése
          await answerCallback(callbackQueryId, 'Sikeresen elfogadtad a fuvart! 🛵💨', false);

          // 3. Frissítjük a csoportban lévő üzenetet (eltávolítjuk a gombot, kiírjuk ki vitte el)
          const newText = `${callbackQuery.message.text}\n\n✅ **Elfogadva:** ${courierName} által (${new Date().toLocaleTimeString('hu-HU', {hour: '2-digit', minute:'2-digit'})})`;
          
          await editTelegramMessage(
            callbackQuery.message.chat.id,
            callbackQuery.message.message_id,
            newText,
            null // null-al töröljük az inline billentyűzetet (gombot)
          );

          // 4. Külön privát üzenetet is küldhetünk a futárnak a részletes linkkel
          // (Ez csak akkor működik, ha a futár már indította a botot privátban is)
          const deliveryLink = `https://visitkoszeg.hu/eats/courier?id=${orderId}`;
          const privateText = `🛵 **Új fuvarod részletei:**\n📍 **Étterem:** ${order.restaurant_name}\n🏠 **Cím:** ${order.delivery_address}\n💰 **Fizetendő:** ${order.total_price} Ft\n\nKattints ide a navigációhoz és lezáráshoz:\n${deliveryLink}`;
          
          await sendTelegramMessage(courierTelegramId, privateText);

        } else {
          // Ha már valaki elvitte a fuvart
          await answerCallback(
            callbackQueryId, 
            'Sajnálom, ezt a fuvart már elvitte egy másik futár! ❌', 
            true // Felugró ablakban jelenik meg a hiba
          );

          // Opcionálisan frissíthetjük a csoport üzenetet, hogy szinkronban legyen a valósággal
          // (Ha valamiért korábban nem frissült volna)
          const takenText = `${callbackQuery.message.text}\n\n⚠️ *Ezt a fuvart már elvitték!*`;
          await editTelegramMessage(
            callbackQuery.message.chat.id,
            callbackQuery.message.message_id,
            takenText,
            null
          );
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Update processed" }),
    };

  } catch (err) {
    console.error('[TelegramWebhook] Globális hiba:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

// ---- HELPER FUNKCIÓK A TELEGRAM API HIVÁSOKHOZ ----

// 1. Callback query megválaszolása (hogy eltűnjön a betöltő homokóra a gombról)
async function answerCallback(callbackQueryId, text, showAlert = false) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert
    })
  });
}

// 2. Üzenet szövegének és gombjainak szerkesztése
async function editTelegramMessage(chatId, messageId, text, replyMarkup) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    })
  });
}

// 3. Új üzenet küldése (privátban a futárnak)
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.warn('[TelegramWebhook] Nem sikerült privát üzenetet küldeni a futárnak (valószínűleg nem indította el a botot):', e.message);
  }
}
