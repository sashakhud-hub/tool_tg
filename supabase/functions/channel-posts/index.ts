import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const channelName = url.searchParams.get("channel") ?? "";
  const safeChannel = channelName.replace(/[^\w\-]/g, "_") || "unknown";

  try {
    const sb = getSupabase();
    const { data } = await sb.from("tele_post").select("id,url,text,date,reactions").eq("channel_name", safeChannel).order("id");
    return new Response(JSON.stringify(data ?? []), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
