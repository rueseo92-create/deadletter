import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { getAllPosts } from "@/lib/posts";
import { CategoryOverview } from "@/components/CategoryOverview";
import { Icon } from "@/components/Icon";
import { defaultLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "소개",
  description: `${siteConfig.name} — 무엇을 다루고, 어떻게 만들고, 어떻게 바로잡는지 공개합니다.`,
};

const PROCESS = [
  {
    title: "원문부터 수집",
    desc: "기업 공식 발표, 제품 문서, 가격표, 원문 기사와 논문을 먼저 모읍니다. 2차 요약 글만 보고 쓰지 않습니다.",
  },
  {
    title: "AI 보조 초안",
    desc: "자료 정리와 초안 구조화에는 AI를 사용합니다. 무엇을 쓸지, 어떤 결론을 낼지는 편집 기준에 따라 결정합니다.",
  },
  {
    title: "슬롭 킬러 검수",
    desc: "서로 다른 관점의 10인 검수 패널 ‘슬롭 킬러’가 사실 관계, 과장 표현, 실제 효용, 출처 일치 여부를 따로 평가합니다. 기준 이상 통과한 글만 발행하고, 통과 결과는 글 상단에 ‘슬롭 킬러 검수 9/10 통과’처럼 표시합니다.",
  },
  {
    title: "출처 공개",
    desc: "모든 글 하단에 참고한 원문 링크를 남깁니다. 독자가 직접 확인할 수 있어야 좋은 정리라고 믿습니다.",
  },
];

const POLICIES = [
  {
    title: "출처 인용 원칙",
    items: [
      "숫자·가격·정책·출시일 등 사실 정보에는 가능한 한 1차 출처를 답니다.",
      "확인되지 않은 루머나 유출 정보는 ‘미확인’임을 분명히 밝히거나 다루지 않습니다.",
      "수익을 약속하는 표현(‘누구나 월 100만 원’ 등)은 쓰지 않습니다. 부업 글에는 비용과 리스크를 함께 적습니다.",
    ],
  },
  {
    title: "정정 정책",
    items: [
      "오류를 확인하면 본문을 수정하고, 중요한 정정은 글 안에 정정 내역을 남깁니다.",
      "AI 도구의 가격·기능은 자주 바뀌므로, 변경이 확인되면 최신 정보로 업데이트합니다.",
      `오류 제보: ${siteConfig.email}`,
    ],
  },
  {
    title: "광고와 제휴",
    items: [
      "사이트 운영을 위해 Google AdSense와 쿠팡 파트너스 링크를 사용합니다.",
      "제휴 링크는 ‘광고’로 표시하며, 제휴 여부가 추천 내용에 영향을 주지 않도록 합니다.",
      siteConfig.coupang.disclaimer,
    ],
  },
];

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale = (params?.locale || defaultLocale) as Locale;
  const posts = getAllPosts();
  const counts: Record<string, number> = {};
  posts.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  return (
    <div>
      {/* Hero */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-page px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <p className="eyebrow">About {siteConfig.nameEn}</p>
          <h1 className="mt-4 max-w-3xl text-[2rem] font-bold leading-[1.28] tracking-[-0.035em] text-ink sm:text-[2.6rem]">
            AI 정보는 넘칩니다.
            <br />
            <span className="text-ink-3">검증된 정리는 드뭅니다.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[16.5px] leading-[1.8] text-ink-2">
            세로AI는 AI 자동화, AI 부업, AI 뉴스, AI 도구를 다루는 미디어입니다. 매일 쏟아지는 AI 소식과 도구 가운데
            실제로 일과 수익에 도움이 되는 것만 골라, 원문 출처와 함께 이해하기 쉽게 정리합니다.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-page px-4 sm:px-6">
        {/* What we cover */}
        <section aria-labelledby="cover-title" className="py-12 sm:py-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">What we cover</p>
              <h2 id="cover-title" className="mt-2 text-[1.45rem] font-bold tracking-[-0.025em] text-ink">
                다루는 주제
              </h2>
            </div>
          </div>
          <CategoryOverview locale={locale} counts={counts} />
        </section>

        {/* How posts are made */}
        <section aria-labelledby="process-title" className="border-t border-line py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">How we work</p>
              <h2 id="process-title" className="mt-2 text-[1.45rem] font-bold tracking-[-0.025em] text-ink">
                글은 이렇게 만들어집니다
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
                세로AI는 AI를 활용해 글을 만듭니다. 그 사실을 숨기지 않고, 대신 ‘AI 슬롭’이 나가지 않도록 검수 과정을
                공개합니다.
              </p>
            </div>
            <ol className="space-y-px overflow-hidden rounded-xl border border-line bg-line lg:col-span-8">
              {PROCESS.map((step, i) => (
                <li key={step.title} className="flex gap-4 bg-surface p-5 sm:p-6">
                  <span className="text-[13px] font-semibold tabular-nums text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-[1.75] text-ink-2">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Policies */}
        <section aria-labelledby="policy-title" className="border-t border-line py-12 sm:py-16">
          <p className="eyebrow">Policies</p>
          <h2 id="policy-title" className="mt-2 text-[1.45rem] font-bold tracking-[-0.025em] text-ink">
            편집 원칙
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {POLICIES.map((p) => (
              <div key={p.title}>
                <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-2">
                      <Icon name="check" className="mt-[5px] h-3.5 w-3.5 flex-shrink-0 text-accent" strokeWidth={2.2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Archive + contact */}
        <section aria-labelledby="contact-title" className="border-t border-line py-12 sm:py-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-6">
              <div className="flex items-center gap-2">
                <Icon name="archive" className="h-4 w-4 text-ink-3" />
                <h2 className="text-[15px] font-semibold text-ink">이전 글 보관 안내</h2>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                이 사이트는 이전에 금융·보험·건강·생활 정보를 다뤘습니다. 해당 글은 삭제하지 않고 주소를 유지하되, 목록과
                검색에서는 제외해 ‘보관 글’로 표시합니다. 보관 글의 정보는 최신이 아닐 수 있습니다.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-6">
              <div className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 text-ink-3" />
                <h2 id="contact-title" className="text-[15px] font-semibold text-ink">
                  문의 · 제보
                </h2>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                오류 제보, 다뤄 줬으면 하는 AI 도구나 뉴스, 협업 제안은 이메일로 보내 주세요.
              </p>
              {/* TODO: 실제 이메일 확인 */}
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent underline-offset-2 hover:underline"
              >
                {siteConfig.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
