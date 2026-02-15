import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const getSupabase = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
};
