import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel") ?? "unknown";
  const safeChannel = channel.replace(/[^\w\-]/g, "_") || "unknown";

  try {
    const sb = getSupabase();
    const { data } = await sb.from("tele_post").select("id,url,text,date,reactions").eq("channel_name", safeChannel).order("id");
    const posts = data ?? [];
    return new Response(JSON.stringify(posts, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="posts_${safeChannel}.json"`,
      },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
