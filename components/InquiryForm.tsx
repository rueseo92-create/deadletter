"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";

interface Props {
  services: { id: string; name: string }[];
  email: string;
}

export default function InquiryForm({ services, email }: Props) {
  const id = useId();
  const [picked, setPicked] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "mail">("idle");
  const [error, setError] = useState("");
  const [mailHref, setMailHref] = useState("");

  const toggle = (sid: string) =>
    setPicked((p) => (p.includes(sid) ? p.filter((x) => x !== sid) : [...p, sid]));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name") || ""),
      contact: String(f.get("contact") || ""),
      business: String(f.get("business") || ""),
      message: String(f.get("message") || ""),
      services: picked,
    };
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return setStatus("done");
      if (json.fallback === "mail") {
        const names = services.filter((s) => picked.includes(s.id)).map((s) => s.name).join(", ") || "아직 모르겠음";
        const body = `이름/상호: ${data.name}\n연락처: ${data.contact}\n업종: ${data.business}\n관심 서비스: ${names}\n\n${data.message}`;
        setMailHref(`mailto:${email}?subject=${encodeURIComponent("[딸깍 상담] " + data.name)}&body=${encodeURIComponent(body)}`);
        return setStatus("mail");
      }
      setError(json.error || "오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
      setStatus("error");
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <p className="flex items-center gap-2 text-[17px] font-bold text-ink">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink text-bg">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
          </span>
          상담 신청이 접수됐어요
        </p>
        <p className="mt-2 text-[15px] text-ink-3">영업일 기준 하루 안에 남겨 주신 연락처로 답장드릴게요.</p>
      </div>
    );
  }

  if (status === "mail") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-[17px] font-bold text-ink">메일로 한 번만 보내 주세요</p>
        <p className="mt-2 text-[15px] text-ink-3">온라인 접수 창구를 준비 중이에요. 적어 주신 내용을 그대로 담은 메일을 열어 드릴게요.</p>
        <a href={mailHref} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[15px] font-semibold text-bg hover:opacity-90">
          <Icon name="mail" className="h-4 w-4" /> 메일 앱으로 보내기
        </a>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">이름 또는 상호 *</span>
          <input name="name" required maxLength={40} className={input} placeholder="예: 망원동 OO베이커리" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">답장받을 연락처 *</span>
          <input name="contact" required maxLength={80} className={input} placeholder="이메일 또는 010-0000-0000" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">업종</span>
        <input name="business" maxLength={80} className={input} placeholder="예: 동네 빵집, 1인 쇼핑몰, 인테리어 회사" />
      </label>
      <fieldset>
        <legend className="mb-2 block text-[13px] font-medium text-ink-2">관심 있는 것 (여러 개 가능)</legend>
        <div className="flex flex-wrap gap-2">
          {services.concat({ id: "unsure", name: "아직 모르겠어요" }).map((s) => {
            const on = picked.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={`rounded-full border px-3.5 py-2 text-[14px] transition ${
                  on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink-2 hover:border-line-strong"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">요즘 가장 시간 잡아먹는 일 *</span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          className={input}
          placeholder="예: 매일 저녁 예약 문자를 엑셀에 옮겨 적는 데 1시간씩 걸려요."
        />
      </label>
      {status === "error" && (
        <p id={`${id}-err`} role="alert" className="text-[14px] font-medium text-red-600">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-bold text-bg hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "보내는 중…" : "무료 상담 신청하기"}
        </button>
        <p className="text-[12.5px] text-ink-3">상담 답장 외의 용도로 연락처를 쓰지 않아요.</p>
      </div>
    </form>
  );
}
