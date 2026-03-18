import { createClient, SupabaseClient } from "@supabase/supabase-js";

function createNoopChain(): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      if (prop === "data") return null;
      if (prop === "error") return null;
      if (prop === "count") return null;
      return (..._args: any[]) => createNoopChain();
    },
    apply() {
      return createNoopChain();
    },
  });
}

export function createServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    return createNoopChain() as SupabaseClient;
  }

  return createClient(url, key);
}
