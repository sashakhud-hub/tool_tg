import { corsHeaders } from "../_shared/cors.ts";

const SYS = `Ты — опытный редактор и помощник автора Telegram-канала.
Тебе даны выбранные посты канала. Выполни инструкцию пользователя.
Отвечай только результатом, без вступлений.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { channel_name, selected_post_ids, instruction, model = "gemini-2.0-flash", temperature = 0.7 } = await req.json();
    const key = Deno.env.get("GOOGLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ ok: false, error: "GOOGLE_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = (await import("../_shared/supabase.ts")).getSupabase();
    const safe = (channel_name ?? "").replace(/[^\w\-]/g, "_") || "unknown";
    const { data: allPosts } = await sb.from("tele_post").select("id,url,text,date,reactions").eq("channel_name", safe);
    const selected = (allPosts ?? []).filter((p) => selected_post_ids?.includes(p.id));
    if (!selected.length) {
      return new Response(JSON.stringify({ ok: false, error: "No valid posts selected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const postsText = selected
      .map((p) => `Post ${p.id} (${p.date}):\n${p.text}\nStats: ${p.reactions ?? 0} reactions`)
      .join("\n\n");
    const userMsg = `Посты:\n\n${postsText}\n\nИнструкция: ${instruction ?? ""}`;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYS }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: { temperature },
        }),
      }
    );
    const data = await r.json();
    if (data.error) {
      return new Response(JSON.stringify({ ok: false, error: data.error?.message ?? "Ошибка" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
    return new Response(JSON.stringify({ ok: true, content: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
