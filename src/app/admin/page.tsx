"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Letter, Reply } from "@/types/database";

const ADMIN_PASSWORD = "deadletter2024";
const AUTH_KEY = "deadletter_admin_auth";

type Tab = "letters" | "replies" | "stats";

interface Stats {
  totalLetters: number;
  totalReplies: number;
  totalProfiles: number;
  byCategory: Record<string, number>;
  byEmotion: Record<string, number>;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [tab, setTab] = useState<Tab>("letters");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(AUTH_KEY);
      if (saved === "true") {
        setAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
      sessionStorage.setItem(AUTH_KEY, "true");
    } else {
      setPasswordError(true);
    }
  };

  const fetchLetters = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("letters")
      .select("*")
      .order("created_at", { ascending: false });
    setLetters(data ?? []);
    setLoading(false);
  }, []);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("replies")
      .select("*")
      .order("created_at", { ascending: false });
    setReplies(data ?? []);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const [lettersRes, repliesRes, profilesRes] = await Promise.all([
      supabase.from("letters").select("id, category, emotion"),
      supabase.from("replies").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const allLetters = lettersRes.data ?? [];
    const byCategory: Record<string, number> = {};
    const byEmotion: Record<string, number> = {};

    for (const l of allLetters) {
      byCategory[l.category] = (byCategory[l.category] || 0) + 1;
      byEmotion[l.emotion] = (byEmotion[l.emotion] || 0) + 1;
    }

    setStats({
      totalLetters: allLetters.length,
      totalReplies: repliesRes.count ?? 0,
      totalProfiles: profilesRes.count ?? 0,
      byCategory,
      byEmotion,
    });

    setLoading(false);
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (!authenticated) return;
    if (tab === "letters") fetchLetters();
    else if (tab === "replies") fetchReplies();
    else if (tab === "stats") fetchStats();
  }, [authenticated, tab, fetchLetters, fetchReplies, fetchStats]);

  const deleteLetter = async (id: string) => {
    if (!window.confirm("이 편지를 삭제하시겠습니까?")) return;
    const { error } = await supabase.rpc("admin_delete_letter", { letter_id: id });
    if (error) {
      alert("삭제 실패: " + error.message);
    }
    fetchLetters();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase
      .from("letters")
      .update({ is_published: !current })
      .eq("id", id);
    fetchLetters();
  };

  const deleteReply = async (id: string) => {
    if (!window.confirm("이 답장을 삭제하시겠습니까?")) return;
    const { error } = await supabase.rpc("admin_delete_reply", { reply_id: id });
    if (error) {
      alert("삭제 실패: " + error.message);
    }
    fetchReplies();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (text: string, len: number) =>
    text.length > len ? text.slice(0, len) + "..." : text;

  // ─── Password Gate ───
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-[320px]">
          <div className="font-mono text-[10px] tracking-[4px] uppercase text-dim text-center mb-6">
            admin access
          </div>
          <div className="border border-card-border bg-card-bg p-6">
            <label className="block font-mono text-[11px] text-dim tracking-wider mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-bg border border-card-border text-fg text-sm px-3 py-2.5 font-mono focus:outline-none focus:border-accent mb-3"
              placeholder="비밀번호를 입력하세요"
              autoFocus
            />
            {passwordError && (
              <p className="text-stamp-red text-[11px] font-mono mb-3">
                비밀번호가 틀렸습니다.
              </p>
            )}
            <button
              onClick={handleLogin}
              className="w-full font-mono text-[12px] tracking-wider bg-blue text-white px-4 py-2.5 hover:bg-blue/80 transition-colors"
            >
              로그인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  return (
    <section className="min-h-screen pt-24 pb-20 px-6 md:px-10 max-w-[1200px] mx-auto">
      <div className="font-mono text-[10px] tracking-[4px] uppercase text-dim mb-2">
        deadletter admin
      </div>
      <h1 className="font-display text-[28px] text-accent-bright mb-8">
        관리자 대시보드
      </h1>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-card-border mb-8">
        {([
          ["letters", "편지"],
          ["replies", "답장"],
          ["stats", "통계"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-mono text-[12px] tracking-wider px-6 py-3 transition-colors border-b-2 -mb-px ${
              tab === key
                ? "text-accent-bright border-accent"
                : "text-dim border-transparent hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-20">
          <span className="font-mono text-[12px] text-dim tracking-wider">
            불러오는 중...
          </span>
        </div>
      )}

      {/* ─── Letters Tab ─── */}
      {!loading && tab === "letters" && (
        <div>
          <div className="font-mono text-[11px] text-dim mb-4">
            전체 편지: {letters.length}개
          </div>

          {letters.length === 0 ? (
            <div className="text-center py-16 text-dim font-mono text-[12px]">
              편지가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-card-border">
                    {["번호", "수신인", "카테고리", "감정", "내용", "작성일", "공개", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="font-mono text-[10px] tracking-wider text-dim uppercase py-3 px-2 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {letters.map((letter) => (
                    <tr
                      key={letter.id}
                      className="border-b border-card-border/50 hover:bg-hover transition-colors"
                    >
                      <td className="font-mono text-[12px] text-accent py-3 px-2 whitespace-nowrap">
                        DL-{String(letter.letter_number).padStart(4, "0")}
                      </td>
                      <td className="text-[13px] text-fg py-3 px-2 max-w-[120px] truncate">
                        {letter.recipient_label}
                      </td>
                      <td className="font-mono text-[11px] text-dim py-3 px-2 whitespace-nowrap">
                        {letter.category}
                      </td>
                      <td className="font-mono text-[11px] text-dim py-3 px-2 whitespace-nowrap">
                        {letter.emotion}
                      </td>
                      <td className="text-[13px] text-dim py-3 px-2 max-w-[200px]">
                        {truncate(letter.body, 50)}
                      </td>
                      <td className="font-mono text-[11px] text-dim py-3 px-2 whitespace-nowrap">
                        {formatDate(letter.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() =>
                            togglePublish(letter.id, letter.is_published)
                          }
                          className={`font-mono text-[10px] tracking-wider px-3 py-1 border transition-colors ${
                            letter.is_published
                              ? "border-blue text-blue hover:bg-blue/10"
                              : "border-card-border text-dim hover:text-fg"
                          }`}
                        >
                          {letter.is_published ? "공개" : "비공개"}
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => deleteLetter(letter.id)}
                          className="font-mono text-[10px] tracking-wider text-stamp-red hover:text-red-400 transition-colors px-2 py-1 border border-stamp-red/30 hover:border-stamp-red"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Replies Tab ─── */}
      {!loading && tab === "replies" && (
        <div>
          <div className="font-mono text-[11px] text-dim mb-4">
            전체 답장: {replies.length}개
          </div>

          {replies.length === 0 ? (
            <div className="text-center py-16 text-dim font-mono text-[12px]">
              답장이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-card-border">
                    {["편지 ID", "내용", "작성일", ""].map((h) => (
                      <th
                        key={h}
                        className="font-mono text-[10px] tracking-wider text-dim uppercase py-3 px-2 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {replies.map((reply) => (
                    <tr
                      key={reply.id}
                      className="border-b border-card-border/50 hover:bg-hover transition-colors"
                    >
                      <td className="font-mono text-[12px] text-accent py-3 px-2 whitespace-nowrap">
                        {reply.letter_id.slice(0, 8)}...
                      </td>
                      <td className="text-[13px] text-dim py-3 px-2 max-w-[400px]">
                        {truncate(reply.body, 50)}
                      </td>
                      <td className="font-mono text-[11px] text-dim py-3 px-2 whitespace-nowrap">
                        {formatDate(reply.created_at)}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => deleteReply(reply.id)}
                          className="font-mono text-[10px] tracking-wider text-stamp-red hover:text-red-400 transition-colors px-2 py-1 border border-stamp-red/30 hover:border-stamp-red"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Stats Tab ─── */}
      {!loading && tab === "stats" && stats && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "전체 편지", value: stats.totalLetters },
              { label: "전체 답장", value: stats.totalReplies },
              { label: "전체 프로필", value: stats.totalProfiles },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-card-border bg-card-bg p-5"
              >
                <div className="font-mono text-[10px] tracking-[2px] text-dim uppercase mb-2">
                  {item.label}
                </div>
                <div className="font-display text-[32px] text-accent-bright">
                  {item.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          <div className="border border-card-border bg-card-bg p-5">
            <div className="font-mono text-[10px] tracking-[2px] text-dim uppercase mb-4">
              카테고리별 편지
            </div>
            {Object.keys(stats.byCategory).length === 0 ? (
              <div className="text-dim font-mono text-[12px]">데이터 없음</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-dim w-[160px] shrink-0">
                        {category}
                      </span>
                      <div className="flex-1 h-5 bg-bg overflow-hidden">
                        <div
                          className="h-full bg-blue/40 transition-all"
                          style={{
                            width: `${
                              (count / stats.totalLetters) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-accent w-[40px] text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Emotion Breakdown */}
          <div className="border border-card-border bg-card-bg p-5">
            <div className="font-mono text-[10px] tracking-[2px] text-dim uppercase mb-4">
              감정별 편지
            </div>
            {Object.keys(stats.byEmotion).length === 0 ? (
              <div className="text-dim font-mono text-[12px]">데이터 없음</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.byEmotion)
                  .sort(([, a], [, b]) => b - a)
                  .map(([emotion, count]) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-dim w-[160px] shrink-0">
                        {emotion}
                      </span>
                      <div className="flex-1 h-5 bg-bg overflow-hidden">
                        <div
                          className="h-full bg-accent/30 transition-all"
                          style={{
                            width: `${
                              (count / stats.totalLetters) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-accent w-[40px] text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
