import { corsHeaders } from "../_shared/cors.ts";
import { geminiGenerate } from "../_shared/gemini.ts";
import { getSupabase } from "../_shared/supabase.ts";

const SYS = `You are a helpful assistant filtering Telegram channel updates.
The user wants to know what they missed relevant to their interest.
Identify matching posts, present as Markdown with links.
Always answer in Russian.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { channel_name, days_back = 30, user_interest, model } = await req.json();
    const key = Deno.env.get("GOOGLE_API_KEY");
    if (!key || !user_interest) {
      return new Response(JSON.stringify({ ok: false, error: "GOOGLE_API_KEY не настроен или интересы не указаны" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = getSupabase();
    const safe = (channel_name ?? "").replace(/[^\w\-]/g, "_") || "unknown";
    const { data: allPosts } = await sb.from("tele_post").select("id,url,text,date,reactions").eq("channel_name", safe);
    const posts = (allPosts ?? []);
    const parseDate = (s: string) => {
      try {
        const [d, m, y] = s.slice(0, 10).split(".").map(Number);
        return d && m && y ? new Date(y, m - 1, d) : null;
      } catch {
        return null;
    }
  };
    const withDate = posts
      .map((p) => ({ d: parseDate(p.date ?? ""), p }))
      .filter((x) => x.d);
    if (!withDate.length) {
      return new Response(JSON.stringify({ ok: true, markdown: "Нет постов с датами." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const latest = new Date(Math.max(...withDate.map((x) => x.d!.getTime())));
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - (days_back ?? 30));
    const filtered = withDate.filter((x) => x.d! >= cutoff).map((x) => x.p);
    filtered.sort((a, b) => (b.reactions ?? 0) - (a.reactions ?? 0));
    const top = filtered.slice(0, 50);
    const userMsg = `Посты:\n${JSON.stringify(top, null, 1)}\n\nИнтерес пользователя: ${user_interest}`;
    const result = await geminiGenerate({
      key,
      model,
      systemInstruction: SYS,
      userContent: userMsg,
      temperature: 0.3,
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ ok: false, error: result.error ?? "Ошибка AI" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, markdown: result.text ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
