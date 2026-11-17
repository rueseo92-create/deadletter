"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";

interface Props {
  placeholder: string;
  buttonText: string;
}

export default function NewsletterForm({ placeholder, buttonText }: Props) {
  const [email, setEmail] = useState("");
  // 정보통신망법 제50조: 광고성 정보 수신 사전 동의
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (!agree) {
      setStatus("error");
      setMessage("뉴스레터 수신 동의에 체크해 주세요.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent: true }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("구독 완료! 다음 브리핑부터 보내드릴게요.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "오류가 발생했습니다.");
      }
    } catch {
      setStatus("error");
      setMessage("네트워크 오류가 발생했습니다.");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="flex items-center gap-2 text-[15px] font-medium text-ink">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-fg">
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate={false}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          이메일 주소
        </label>
        <input
          id={inputId}
          className="h-11 w-full min-w-0 flex-1 rounded-lg border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder={placeholder}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `${inputId}-err` : undefined}
          required
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 flex-shrink-0 rounded-lg bg-ink px-5 text-[15px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "처리 중…" : buttonText}
        </button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-3">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => {
            setAgree(e.target.checked);
            if (status === "error") setStatus("idle");
          }}
          className="mt-0.5"
        />
        <span>
          (필수) 세로AI의 새 글 소식과 서비스 안내 등 광고성 정보를 이메일로 받는 데 동의합니다. 수집 항목은
          이메일 주소, 목적은 뉴스레터 발송, 보관은 구독 해지 시까지입니다. 동의하지 않으면 구독할 수 없으며,
          언제든 메일 하단의 수신거부로 해지할 수 있습니다.{" "}
          <a href="/privacy" className="underline underline-offset-2">개인정보처리방침</a>
        </span>
      </label>
      {status === "error" && (
        <p id={`${inputId}-err`} role="alert" className="mt-2 text-[13px] text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
