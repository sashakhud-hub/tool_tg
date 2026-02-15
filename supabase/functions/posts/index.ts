import { corsHeaders } from "../_shared/cors.ts";
import { getSupabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel_name") ?? "";
  const sortBy = url.searchParams.get("sort_by") ?? "date";
  const order = url.searchParams.get("order") ?? "desc";
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20")));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0"));
  const search = url.searchParams.get("search") ?? "";

  const safeChannel = channel.replace(/[^\w\-]/g, "_") || "unknown";

  try {
    const sb = getSupabase();
    let q = sb.from("tele_post").select("id,url,text,date,reactions", { count: "exact" }).eq("channel_name", safeChannel);
    if (search) q = q.ilike("text", `%${search}%`);
    const col = sortBy === "reactions" ? "reactions" : "id";
    q = q.order(col, { ascending: order === "asc" });
    const { data, count } = await q.range(offset, offset + limit - 1);
    return new Response(JSON.stringify({ posts: data ?? [], total: count ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
