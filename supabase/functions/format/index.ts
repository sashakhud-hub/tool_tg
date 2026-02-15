import { corsHeaders } from "../_shared/cors.ts";

function formatInline(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts: string[] = [];
  let last = 0;
  for (const m of escaped.matchAll(/`(.*?)`/g)) {
    parts.push(formatNonCode(escaped.slice(last, m.index)));
    parts.push(`<code>${m[1]}</code>`);
    last = (m.index ?? 0) + m[0].length;
  }
  parts.push(formatNonCode(escaped.slice(last)));
  return parts.join("");
}

function formatNonCode(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/(?<!\s)\*(.*?)\*(?!\s)/g, "<i>$1</i>")
    .replace(/~~(.*?)~~/g, "<s>$1</s>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

function toHtml(text: string): string {
  const codeBlocks: Record<string, string> = {};
  let i = 0;
  let html = text.replace(/```([\s\S]*?)```/g, (_, c) => {
    const key = `\x00CB${i}\x00`;
    codeBlocks[key] = `<pre>${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
    i++;
    return key;
  });
  const lines = html.split("\n").map((line) => {
    for (const [k, v] of Object.entries(codeBlocks)) {
      if (line.includes(k)) line = line.replace(k, v);
    }
    const num = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (num) return `${num[1]}. ${formatInline(num[2])}`;
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    if (bullet) return `• ${formatInline(bullet[1])}`;
    return formatInline(line);
  });
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });
  try {
    const { text } = await req.json();
    const html = text ? toHtml(text) : "";
    return new Response(JSON.stringify({ html, telegram: text ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ html: "", telegram: "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
