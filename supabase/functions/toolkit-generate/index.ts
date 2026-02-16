import { corsHeaders } from "../_shared/cors.ts";
import { geminiGenerate } from "../_shared/gemini.ts";
import { getSupabase } from "../_shared/supabase.ts";

const SYS = `Ты — опытный редактор и помощник автора Telegram-канала.
Тебе даны выбранные посты канала. Выполни инструкцию пользователя.
Отвечай только результатом, без вступлений.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { channel_name, selected_post_ids, instruction, model, temperature = 0.7 } = await req.json();
    const key = Deno.env.get("GOOGLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ ok: false, error: "GOOGLE_API_KEY не настроен" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = getSupabase();
    const safe = (channel_name ?? "").replace(/[^\w\-]/g, "_") || "unknown";
    const { data: allPosts } = await sb.from("tele_post").select("id,url,text,date,reactions").eq("channel_name", safe);
    const selected = (allPosts ?? []).filter((p) => selected_post_ids?.includes(p.id));
    if (!selected.length) {
      return new Response(JSON.stringify({ ok: false, error: "Нет выбранных постов" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const postsText = selected
      .map((p) => `Post ${p.id} (${p.date}):\n${p.text}\nStats: ${p.reactions ?? 0} reactions`)
      .join("\n\n");
    const userMsg = `Посты:\n\n${postsText}\n\nИнструкция: ${instruction ?? ""}`;
    const result = await geminiGenerate({
      key,
      model,
      systemInstruction: SYS,
      userContent: userMsg,
      temperature,
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ ok: false, error: result.error ?? "Ошибка AI" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, content: result.text ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
