/** 세로AI 딸깍스튜디오 워드마크 — "세로(vertical)"를 액센트 세로 막대로 표현 */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-[15px]" : "text-[17px]";
  const bar = size === "sm" ? "h-[15px]" : "h-[17px]";
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-[-0.03em] ${text}`}>
      <span aria-hidden="true" className={`inline-block w-[4px] rounded-full bg-accent ${bar}`} />
      <span className="text-ink">
        세로<span className="text-accent">AI</span>
      </span>
      <span className="font-semibold text-ink-3">딸깍스튜디오</span>
    </span>
  );
}
