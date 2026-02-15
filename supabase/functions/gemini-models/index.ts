import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const key = Deno.env.get("GOOGLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ ok: false, error: "GOOGLE_API_KEY не настроен" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await r.json();
    if (data.error) {
      return new Response(JSON.stringify({ ok: false, error: data.error?.message ?? "Ошибка" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const skip = ["embedding", "embed", "token", "semantic"];
    const models = (data.models ?? [])
      .filter((m: { name?: string }) => {
        const id = (m.name ?? "").replace("models/", "");
        return !skip.some((k) => id.toLowerCase().includes(k));
      })
      .map((m: { name?: string; displayName?: string }) => ({
        id: (m.name ?? "").replace("models/", ""),
        name: m.displayName ?? m.name ?? "",
      }));
    return new Response(JSON.stringify({ ok: true, models }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
