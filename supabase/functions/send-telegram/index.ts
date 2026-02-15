import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

const MAX_LENGTH = 4096;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { username, html } = await req.json();
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!token || !username || !html) {
      return new Response(
        JSON.stringify({ ok: false, error: "TELEGRAM_BOT_TOKEN не настроен или не указаны username/html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const clean = username.replace(/^@/, "").toLowerCase();
    const sb = getSupabase();
    const { data: row } = await sb.from("telegram_users").select("chat_id").eq("username", clean).single();
    if (!row?.chat_id) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `@${clean} не найден. Напишите боту /start и попробуйте снова.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    let parts: string[];
    if (html.length <= MAX_LENGTH) {
      parts = [html];
    } else {
      parts = [];
      let cur = "";
      for (const line of html.split(/\n/)) {
        if (cur.length + line.length + 1 < MAX_LENGTH) {
          cur = cur ? cur + "\n" + line : line;
        } else {
          if (cur) parts.push(cur);
          cur = line;
        }
      }
      if (cur) parts.push(cur);
    }
    for (const chunk of parts) {
      if (!chunk.trim()) continue;
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: row.chat_id,
          text: chunk,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const d = await r.json();
      if (!d.ok) {
        return new Response(JSON.stringify({ ok: false, error: d.description ?? "Ошибка отправки" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
