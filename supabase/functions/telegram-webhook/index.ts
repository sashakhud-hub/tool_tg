import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

const START_MSG = `Привет! Я бот TeleTools.

Теперь я могу отправлять тебе отформатированные посты прямо из веб-редактора — с <b>жирным</b>, <i>курсивом</i> и <a href="https://example.com">кликабельными ссылками</a>.

Твой аккаунт подключён. Укажи свой @username в редакторе и жми «Отправить в Telegram».`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const upd = await req.json();
    const msg = upd?.message;
    if (!msg) return new Response("ok");
    const from = msg.from ?? {};
    const username = (from.username ?? "").toLowerCase();
    const chatId = msg.chat?.id;
    const text = (msg.text ?? "").trim();
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!token) return new Response("ok");
    if (username && chatId) {
      const sb = getSupabase();
      await sb.from("telegram_users").upsert(
        { username, chat_id: chatId, updated_at: new Date().toISOString() },
        { onConflict: "username" }
      );
    }
    if (text === "/start" && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: START_MSG,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
    }
    return new Response("ok");
  } catch {
    return new Response("ok");
  }
});
