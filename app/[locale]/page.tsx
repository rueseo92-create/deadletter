import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/config";
import { SERVICES, PROCESS, PLANS, FAQ } from "@/lib/agency";
import { PostCard } from "@/components/PostCard";
import InquiryForm from "@/components/InquiryForm";
import PortfolioShowcase from "@/components/PortfolioShowcase";
import { Icon } from "@/components/Icon";
import { localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

const PAINS = [
  { t: "유튜브에선 딸깍이라던데", d: "따라 해 보면 API 키, 오류, 연결 실패. 어디서부터 막힌 건지도 모르겠어요." },
  { t: "본업만으로도 하루가 빠듯한데", d: "AI 공부까지 할 시간은 없어요. 매일 하는 정리·답장·보고서만 줄어도 좋겠는데." },
  { t: "외주 맡겼더니 만들고 끝", d: "결국 안 쓰게 됐어요. 우리 가게에 맞게 고쳐 주는 사람이 없었으니까요." },
];


// 팀 소개는 개인이 특정되지 않는 수준까지만 (이름·병원·학교·국가·논문 표기 금지)
const TEAM = [
  {
    role: "상담 · 기획",
    name: "대표",
    items: [
      "간호사 면허 2개 (대한민국, 미국 뉴욕주)",
      "디지털헬스 박사",
      "상급종합병원 의료 AI 연구원",
      "해외 병원 디지털헬스 부서 근무",
      "디지털치료제 스타트업 PM, 대학병원 임상연구 코디네이터",
    ],
  },
  {
    role: "제작",
    name: "개발 리드",
    items: ["업무 자동화·홈페이지·웹앱 제작", "AI 블로그 자동 발행·검수 시스템 개발", "만든 뒤 고치기와 유지보수"],
  },
];

export default async function Home({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const lh = (path: string) => localizedHref(path, locale);

  const posts = getAllPosts(locale as "ko" | "en");
  const latest = posts.slice(0, 3);
  const { kmongUrl, kakaoUrl } = siteConfig.contact;

  return (
    <div>
      {/* ── Hero ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-page gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow">세로AI {siteConfig.studio} · AI 자동화 대행</p>
            <h1 className="mt-5 text-[2.3rem] font-black leading-[1.15] tracking-[-0.045em] text-ink sm:text-[3.2rem] lg:text-[3.7rem]">
              AI로 딸깍 하면 된다던데,
              <br />
              <span className="text-ink-3">안 되는 게 정상이에요.</span>
            </h1>
            <p className="mt-6 text-[1.35rem] font-bold leading-snug tracking-[-0.02em] text-ink sm:text-[1.6rem]">
              세팅은 저희가 할게요. 사장님은 <span className="hl">딸깍만</span> 하세요.
            </p>
            <p className="mt-4 max-w-xl text-[16px] leading-[1.75] text-ink-2">
              사업부터 이해하고, 매일 반복하는 일을 자동화하고, 써 보면서 같이 고치고, 손님이 찾아오게 만드는 것까지.
              AI 공부는 안 하셔도 됩니다.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <a href="#contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-bold text-bg hover:opacity-90">
                무료 상담 신청 <Icon name="arrowRight" className="h-4 w-4" />
              </a>
              <a href="#services" className="inline-flex h-12 items-center justify-center rounded-xl border border-line-strong px-6 text-[15px] font-semibold text-ink hover:border-ink">
                무엇을 해 드리나요
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm rounded-[28px] border border-line bg-surface p-7 sm:p-8">
              <div className="flex justify-center py-4">
                <a
                  href="#contact"
                  aria-label="무료 상담 신청"
                  className="keycap flex h-36 w-36 items-center justify-center rounded-[30px] border border-line-strong bg-bg text-[2.6rem] font-black tracking-[-0.05em] text-ink"
                >
                  딸깍
                </a>
              </div>
              <ul className="mt-8 space-y-3 border-t border-line pt-6 text-[14.5px]">
                {[
                  `이 사이트도 직접 자동 운영 중 · 인사이트 글 ${posts.length}편`,
                  "하루 여러 번 예약 발행, 10단계 AI 검수",
                  "계정 비밀번호는 받지 않아요",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-ink-2">
                    <Icon name="check" className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink" strokeWidth={2.4} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 이런 분께 ── */}
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">이런 사장님께</p>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {PAINS.map((p, i) => (
            <div key={p.t} className="bg-bg p-6 sm:p-8">
              <span className="font-serif text-[2rem] font-black leading-none text-ink-3">“</span>
              <h2 className="mt-2 text-[1.2rem] font-bold tracking-[-0.02em] text-ink">{p.t}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{p.d}</p>
              <span className="sr-only">{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 서비스 ── */}
      <section id="services" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Services</p>
            <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-[-0.04em] text-ink sm:text-[2.4rem]">
              필요한 것만 골라서, <span className="hl">우리 가게에 맞게</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <article key={s.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-bold tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[13px] font-semibold text-ink-2">{s.from}</span>
                </div>
                <h3 className="mt-3 text-[1.25rem] font-bold tracking-[-0.02em] text-ink">{s.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.summary}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-[14px] text-ink-3">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <span aria-hidden className="mt-[9px] h-1 w-1 flex-shrink-0 rounded-full bg-ink-3" />
                      {pt}
                    </li>
                  ))}
                </ul>
                {s.demo && (
                  <a href={s.demo.href.startsWith("/demo") ? s.demo.href : lh(s.demo.href)} className="link-arrow mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-ink hover:text-accent">
                    {s.demo.label} <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 진행 방식 ── */}
      <section className="border-t border-line bg-subtle/60">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">How we work</p>
          <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-ink sm:text-[2.4rem]">만들고 끝이 아니라, 같이 굴립니다</h2>
          <ol className="mt-10 border-t-2 border-ink">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="grid gap-2 border-b border-line py-6 sm:grid-cols-12 sm:items-baseline sm:gap-6">
                <span className="font-serif text-[2.2rem] font-black leading-none tabular-nums text-ink sm:col-span-1">0{i + 1}</span>
                <h3 className="text-[1.35rem] font-bold tracking-[-0.02em] text-ink sm:col-span-3">{p.title}</h3>
                <p className="text-[15.5px] leading-relaxed text-ink-2 sm:col-span-8">{p.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 작업 ── */}
      <section id="work" className="scroll-mt-20 bg-subtle/70">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">Work</p>
          <h2 className="mt-3 text-balance text-[2.2rem] font-black leading-[1.1] tracking-[-0.04em] text-ink sm:text-[3.2rem]">직접 만들어, 매일 돌리고 있습니다.</h2>
          <p className="mt-3 max-w-2xl text-[15px] text-ink-3">직접 만들어 운영 중인 서비스와, 가상의 가게로 만든 데모입니다. 눌러서 직접 써 보세요.</p>
          <PortfolioShowcase lh={lh} />
        </div>
      </section>

      {/* ── 팀 ── */}
      <section id="team" className="scroll-mt-20 border-t border-line bg-subtle/60">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">Team</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {TEAM.map((m) => (
              <div key={m.name} className="rounded-2xl border border-line bg-surface p-7">
                <p className="text-[13px] font-semibold text-ink-3">{m.role}</p>
                <h3 className="mt-1 text-[1.35rem] font-bold tracking-[-0.02em] text-ink">{m.name}</h3>
                <ul className="mt-4 space-y-2 text-[14.5px] text-ink-2">
                  {m.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <Icon name="check" className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink" strokeWidth={2.4} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 가격 ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-ink sm:text-[2.4rem]">
            처음이라면 <span className="hl">딸깍 진단</span>부터
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl p-7 ${p.highlight ? "bg-ink text-bg" : "border border-line bg-surface text-ink"}`}
              >
                <p className={`flex items-center justify-between text-[14px] font-semibold ${p.highlight ? "text-bg/70" : "text-ink-3"}`}>
                  {p.name}
                  {p.highlight && <span className="rounded-full bg-[#ffdf3d] px-2.5 py-0.5 text-[12px] font-bold text-[#151413]">추천</span>}
                </p>
                <p className="mt-3 text-[2.1rem] font-black tracking-[-0.04em]">{p.price}</p>
                <p className={`text-[13px] ${p.highlight ? "text-bg/60" : "text-ink-3"}`}>{p.period}</p>
                <p className={`mt-4 text-[15px] ${p.highlight ? "text-bg/85" : "text-ink-2"}`}>{p.desc}</p>
                <ul className="mt-5 flex-1 space-y-2 text-[14.5px]">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <Icon name="check" className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2.4} />
                      {it}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl text-[14.5px] font-bold ${
                    p.highlight ? "bg-[#ffdf3d] text-[#151413] hover:opacity-90" : "border border-line-strong hover:border-ink"
                  }`}
                >
                  이걸로 상담하기
                </a>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-ink-3">
            개별 작업(자동화 10만 원~, 홈페이지 20만 원~, 웹앱 50만 원~)도 가능합니다. AI·서버·도메인 사용료는 사장님 계정에서 직접 결제됩니다.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-ink">자주 묻는 질문</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-bold text-ink">
                  {f.q}
                  <Icon name="chevronDown" className="h-4 w-4 flex-shrink-0 text-ink-3 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 인사이트 ── */}
      {latest.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-4 py-16 sm:px-6 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Insights</p>
                <h2 className="mt-3 text-[2rem] font-black tracking-[-0.04em] text-ink">사장님을 위한 AI 인사이트</h2>
                <p className="mt-2 text-[15px] text-ink-3">자동 발행 시스템이 매일 조사·작성·검수해서 올립니다.</p>
              </div>
              <a href={lh("/posts")} className="link-arrow hidden items-center gap-1 text-[14px] font-semibold text-ink-2 hover:text-ink sm:inline-flex">
                전체 보기 <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-10 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <PostCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 문의 ── */}
      <section id="contact" className="scroll-mt-20 border-t border-line bg-subtle/60">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Contact</p>
            <h2 className="mt-3 text-[2.2rem] font-black leading-tight tracking-[-0.04em] text-ink">
              무엇이 고민인지
              <br />
              <span className="hl">한 줄</span>이면 충분해요
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">
              어디부터 자동화할지 몰라도 괜찮아요. 지금 가장 시간 잡아먹는 일을 적어 주시면, 할 수 있는 것과 없는 것부터 솔직하게 말씀드릴게요.
            </p>
            {(kmongUrl || kakaoUrl) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {kakaoUrl && (
                  <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-[#fee500] px-5 text-[14.5px] font-bold text-[#191600]">
                    카카오톡으로 문의
                  </a>
                )}
                {kmongUrl && (
                  <a href={kmongUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-[14.5px] font-bold text-ink hover:border-ink">
                    크몽에서 보기
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="lg:col-span-7">
            <InquiryForm services={SERVICES.map((s) => ({ id: s.id, name: s.name }))} email={siteConfig.email} />
          </div>
        </div>
      </section>
    </div>
  );
}
