import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

function parseHtml(html: string, channelLink: string): { id: number; url: string; text: string; date: string; reactions: number }[] {
  const link = channelLink.replace(/\/$/, "");
  const posts: { id: number; url: string; text: string; date: string; reactions: number }[] = [];
  const msgRegex = /<div[^>]*class="[^"]*message[^"]*"[^>]*id="message(\d+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div|$)/gi;
  let m;
  while ((m = msgRegex.exec(html)) !== null) {
    const id = parseInt(m[1], 10);
    const block = m[2];
    const textDiv = block.match(/<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    let text = textDiv ? textDiv[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim() : "";
    const hasMedia = /class="[^"]*media_(photo|video|voice|audio|file)/i.test(block);
    if (!text && !hasMedia) continue;
    const dateDiv = block.match(/<div[^>]*class="[^"]*pull_right date details[^"]*"[^>]*title="([^"]*)"/i);
    const date = dateDiv ? dateDiv[1] : "";
    const url = `${link}/${id}`;
    let reactions = 0;
    const rxMatch = block.match(/<span[^>]*class="[^"]*reactions[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*count[^"]*"[^>]*>(\d+)<\/span>/gi);
    if (rxMatch) {
      rxMatch.forEach((s) => {
        const n = s.match(/<span[^>]*class="[^"]*count[^"]*"[^>]*>(\d+)<\/span>/i);
        if (n) reactions += parseInt(n[1], 10);
      });
    }
    posts.push({ id, url, text, date, reactions });
  }
  return posts;
}

function extractChannel(link: string): string {
  try {
    const p = new URL(link);
    const name = p.pathname.replace(/^\//, "").split("/").pop() ?? "unknown";
    return name.replace(/[^\w\-]/g, "_");
  } catch {
    return "unknown";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const ct = req.headers.get("Content-Type") ?? "";
    const channelLink = "https://t.me/channel";
    let html = "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const link = form.get("channel_link");
      const chLink = typeof link === "string" ? link : channelLink;
      if (!file) {
        return new Response(JSON.stringify({ error: "Файл не загружен" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      html = await file.text();
      const channelName = extractChannel(chLink);
      const posts = parseHtml(html, chLink);
      if (posts.length > 0) {
        const sb = getSupabase();
        const rows = posts.map((p) => ({
          id: p.id,
          channel_name: channelName,
          url: p.url,
          text: p.text,
          date: p.date,
          reactions: p.reactions,
        }));
        await sb.from("tele_post").upsert(rows, { onConflict: "channel_name,id" });
      }
      return new Response(
        JSON.stringify({ message: "Successfully parsed messages", count: posts.length, channel_name: channelName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ error: "Ожидается multipart/form-data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
