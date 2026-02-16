import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";
import { parseHTML } from "https://esm.sh/linkedom@0.18.12";

function parseHtml(html: string, channelLink: string): { id: number; url: string; text: string; date: string; reactions: number }[] {
  const link = channelLink.replace(/\/$/, "");
  const posts: { id: number; url: string; text: string; date: string; reactions: number }[] = [];
  let document: Document;
  try {
    const { document: doc } = parseHTML(html);
    document = doc;
  } catch {
    return posts;
  }
  const root = document.querySelector(".history") ?? document.body ?? document;
  const messages = root.querySelectorAll("div.message");
  for (const msg of messages) {
    const msgId = msg.getAttribute("id") ?? "";
    if (!msgId.startsWith("message") || msgId.startsWith("message-")) continue;
    const id = parseInt(msgId.replace(/^message/, ""), 10);
    if (isNaN(id) || id < 1) continue;

    const textEl = msg.querySelector("div.text");
    let text = "";
    if (textEl) {
      textEl.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
      text = (textEl.textContent ?? "").trim();
    }
    const hasMedia =
      msg.querySelector("div.media_photo") ||
      msg.querySelector("div.media_video") ||
      msg.querySelector("div.media_voice_message") ||
      msg.querySelector("div.media_audio_file") ||
      msg.querySelector("div.media_file");
    if (!text && !hasMedia) continue;

    const dateEl =
      msg.querySelector("div.pull_right.date.details") ||
      msg.querySelector("div.pull_right.date") ||
      msg.querySelector("div[class*='date'][title]");
    const date = (dateEl?.getAttribute("title") ?? "").trim();

    const url = `${link}/${id}`;
    let reactions = 0;
    const rxEl = msg.querySelector("span.reactions");
    if (rxEl) {
      rxEl.querySelectorAll("span.count").forEach((c) => {
        const n = parseInt((c.textContent ?? "").trim(), 10);
        if (!isNaN(n)) reactions += n;
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
