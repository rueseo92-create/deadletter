import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const NOOP_RESULT = { data: null, count: null, error: null };

function createNoopChain(): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
      // await 시 thenable로 인식되지 않도록 then은 undefined 반환
      if (prop === "then") return undefined;
      // 체이닝 끝에서 데이터 접근
      if (prop === "data") return null;
      if (prop === "error") return null;
      if (prop === "count") return null;
      // 그 외 메서드 호출은 체이닝 유지
      return (..._args: any[]) => createNoopChain();
    },
    apply() {
      return createNoopChain();
    },
  });
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createNoopChain() as SupabaseClient);

// 익명 사용자 ID (localStorage 기반)
const USER_ID_KEY = "deadletter_uid";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";

  let uid = localStorage.getItem(USER_ID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, uid);
  }
  return uid;
}
