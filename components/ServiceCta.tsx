import { Icon } from "@/components/Icon";

// 글 하단 상담 안내 — 카테고리에 맞는 한 줄로 대행 서비스를 소개한다
const LINES: Record<string, { title: string; desc: string }> = {
  "ai-automation": {
    title: "읽어 보니 우리 가게에도 필요한데, 세팅할 시간이 없다면",
    desc: "매일 반복하는 일 하나만 알려 주세요. 버튼 하나로 끝나게 대신 세팅해 드려요.",
  },
  "ai-side-hustle": {
    title: "홈페이지·검색·AI 답변 노출, 혼자 챙기기 벅차다면",
    desc: "사장님 사업부터 듣고, 손님이 찾아오는 기반을 같이 만들어요. 순위 보장 같은 말은 하지 않아요.",
  },
  default: {
    title: "AI 공부할 시간은 없는데 써먹고는 싶다면",
    desc: "세팅은 저희가 할게요. 사장님은 딸깍만 하시도록 만들어 드려요.",
  },
};

export function ServiceCta({ category, homeHref }: { category?: string; homeHref: string }) {
  const line = (category && LINES[category]) || LINES.default;
  return (
    <aside aria-label="상담 안내" className="mt-12 rounded-2xl border border-ink/80 bg-surface p-6 sm:p-7">
      <p className="text-[12.5px] font-semibold text-ink-3">세로AI 딸깍스튜디오 · AI 자동화 대행</p>
      <p className="mt-2 text-[1.15rem] font-bold leading-snug tracking-[-0.02em] text-ink">{line.title}</p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{line.desc}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`${homeHref}#contact`} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink px-4 text-[14px] font-bold text-bg hover:opacity-90">
          무료 상담 신청 <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </a>
        <a href={`${homeHref}#services`} className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-[14px] font-semibold text-ink hover:border-ink">
          서비스 보기
        </a>
      </div>
    </aside>
  );
}
