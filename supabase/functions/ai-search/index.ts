import { corsHeaders } from "../_shared/cors.ts";

const PROMPT = `Ты — ассистент, который помогает находить релевантный контент из Telegram-канала.
Тебе предоставлен JSON с постами канала. Каждый пост: {id, url, text, date}.
Правила:
1. Отвечай ТОЛЬКО готовым постом — без вступлений, пояснений и комментариев.
2. Формат ответа — Markdown.
3. Каждый пост оформляй с гиперссылкой: [Краткое описание](url)
4. Группируй по темам с заголовками **Тема**.
5. Добавь краткое описание (1-2 предложения) перед каждой ссылкой.
6. Используй ТОЛЬКО посты из предоставленных данных. Не придумывай ссылки.
7. Если точного совпадения нет — предложи ближайшие по смыслу.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { question, posts_json, model = "gemini-2.0-flash" } = await req.json();
    const key = Deno.env.get("GOOGLE_API_KEY");
    if (!key || !question || !posts_json) {
      return new Response(
        JSON.stringify({ ok: false, error: "GOOGLE_API_KEY не настроен или не указан вопрос/посты" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userMsg = `Вот данные постов канала:\n\n${posts_json}\n\nЗапрос пользователя: ${question}`;
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: { temperature: 0 },
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
    return new Response(JSON.stringify({ ok: true, markdown: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
