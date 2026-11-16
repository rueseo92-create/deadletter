// 문의 유입 경로(첫 방문 기준) 기록. 개인정보 없이 UTM 값, 이전 사이트 도메인, 첫 페이지 경로만 남긴다.
// 브라우저 저장소에 30일 보관하고, 문의 폼이 함께 보낸다. 저장소가 막혀 있으면 조용히 건너뛴다.

export interface Source {
  utm?: string; // "source / medium / campaign"
  ref?: string; // 이전 사이트 도메인 (같은 사이트면 비움)
  landing?: string; // 첫 페이지 경로
  at?: number;
}

const KEY = "sero_src";
const TTL = 30 * 24 * 60 * 60 * 1000;
const cut = (v: string | null | undefined, n = 60) => String(v || "").replace(/[^0-9A-Za-z가-힣._\-/ ]/g, "").slice(0, n);

export function captureSource() {
  try {
    const old = JSON.parse(localStorage.getItem(KEY) || "null") as Source | null;
    const q = new URLSearchParams(location.search);
    const hasUtm = q.has("utm_source");
    // 이미 기록이 있고 30일이 안 지났으면 첫 방문 기준을 유지한다. 새 UTM 링크로 들어오면 갱신.
    if (old && Date.now() - (old.at || 0) < TTL && !hasUtm) return;
    let ref = "";
    try {
      const h = document.referrer ? new URL(document.referrer).hostname : "";
      ref = h && h !== location.hostname ? h : "";
    } catch {}
    const utm = hasUtm
      ? [q.get("utm_source"), q.get("utm_medium"), q.get("utm_campaign")].map((v) => cut(v, 40)).filter(Boolean).join(" / ")
      : "";
    const src: Source = { utm, ref: cut(ref, 80), landing: cut(location.pathname, 100), at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(src));
  } catch {}
}

export function readSource(): Source | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Source | null;
    return s && Date.now() - (s.at || 0) < TTL ? s : null;
  } catch {
    return null;
  }
}

/** 서버에서 받은 값을 정리해 한 줄로. 비어 있으면 "직접 방문/확인 불가". */
export function sourceLine(raw: unknown): string {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s = (k: string, n: number) => cut(typeof o[k] === "string" ? (o[k] as string) : "", n);
  const parts = [
    s("utm", 130) && `UTM ${s("utm", 130)}`,
    s("ref", 80) && `이전 사이트 ${s("ref", 80)}`,
    s("landing", 100) && `첫 페이지 ${s("landing", 100)}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "직접 방문 또는 확인 불가";
}
