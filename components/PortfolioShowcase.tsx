import { Icon } from "@/components/Icon";

// 작업 포트폴리오: 카드마다 CSS 애니메이션 미니 장면 (스타일은 app/globals.css 의 .pf-*)
type Item = {
  no: string;
  title: string;
  en: string;
  desc: string;
  href: string;
  external?: boolean;
  scene: () => React.ReactElement;
};

const BlogScene = () => (
  <div className="pf-blog">
    <div className="pf-doc">
      <i style={{ ["--w" as string]: "90%" }} />
      <i style={{ ["--w" as string]: "75%", animationDelay: ".3s" }} />
      <i style={{ ["--w" as string]: "84%", animationDelay: ".6s" }} />
      <i style={{ ["--w" as string]: "55%", animationDelay: ".9s" }} />
    </div>
    <div className="pf-checks">
      {Array.from({ length: 10 }, (_, i) => (
        <b key={i} style={{ animationDelay: `${1.2 + i * 0.18}s` }} />
      ))}
    </div>
    <span className="pf-stamp">발행 완료</span>
  </div>
);

const BakeryScene = () => (
  <div className="pf-phone">
    <span className="pf-open">● 영업 중</span>
    <div className="pf-chips">
      <em>빵</em>
      <em style={{ animationDelay: "1.5s" }}>케이크</em>
      <em style={{ animationDelay: "3s" }}>음료</em>
    </div>
    <div className="pf-menu">
      <i />
      <i />
    </div>
    <span className="pf-cta">
      예약하기<span className="pf-tap" />
    </span>
  </div>
);

const BookingScene = () => (
  <div className="pf-cal">
    <div className="pf-cal-head">11월 예약</div>
    <div className="pf-grid">
      {Array.from({ length: 12 }, (_, i) => (
        <b key={i} className={i === 10 ? "pf-full" : ""} style={{ animationDelay: `${i * 0.22}s` }}>
          {i === 10 ? "마감" : ""}
        </b>
      ))}
    </div>
  </div>
);

const BaljuScene = () => (
  <div className="pf-bars">
    {[
      ["A몰", "86%", "13,900원"],
      ["B몰", "64%", "11,200원"],
      ["도매", "42%", "8,900원"],
    ].map(([n, h, p], i) => (
      <div key={n} className={`pf-bar ${i === 2 ? "pf-best" : ""}`}>
        <small>{p}</small>
        <i style={{ ["--h" as string]: h, animationDelay: `${i * 0.25}s` }} />
        <span>{n}</span>
      </div>
    ))}
    <span className="pf-tag">최저가</span>
  </div>
);

const AuraScene = () => (
  <div className="pf-chat">
    <p className="pf-q">주차 되나요?</p>
    <p className="pf-a">네, 건물 뒤 무료 주차 2시간 가능해요 🙂</p>
    <p className="pf-q" style={{ animationDelay: "2.2s" }}>오늘 예약 돼요?</p>
    <p className="pf-typing">
      <i />
      <i />
      <i />
    </p>
    <span className="pf-count">오늘 AI 상담 24건</span>
  </div>
);

const TeumScene = () => (
  <div className="pf-split">
    <div className="pf-task">사업계획서 1건</div>
    <div className="pf-pieces">
      {["AI", "AI", "전문가", "AI", "전문가", "AI", "승인"].map((t, i) => (
        <b key={i} className={t === "AI" ? "" : t === "승인" ? "pf-lead" : "pf-pro"} style={{ animationDelay: `${0.8 + i * 0.2}s` }}>
          {t}
        </b>
      ))}
    </div>
  </div>
);

const ITEMS: Item[] = [
  { no: "01", title: "AI 블로그 자동 발행", en: "Auto publishing", desc: "키워드 조사부터 작성, 10단계 검수, 배포까지. 이 사이트의 글이 매일 이렇게 올라옵니다.", href: "/posts", scene: BlogScene },
  { no: "02", title: "동네 빵집 랜딩페이지", en: "Landing page", desc: "요일·시간에 따라 바뀌는 영업 상태, 메뉴 필터, 모바일 예약 버튼.", href: "/demo/bakery.html", scene: BakeryScene },
  { no: "03", title: "예약 관리 웹앱", en: "Booking web app", desc: "4단계 예약, 마감 시간 자동 차단, 관리자 확정. 앱 설치 없이 홈 화면에 추가.", href: "/demo/booking.html", scene: BookingScene },
  { no: "04", title: "발주히어로", en: "Purchase optimizer", desc: "가게 소모품을 여러 쇼핑몰 가격과 비교해 가장 싼 곳을 찾아 주는 자영업자용 서비스.", href: "https://balju-hero.vercel.app", external: true, scene: BaljuScene },
  { no: "05", title: "Aura AI 마케팅", en: "AI marketing", desc: "손님 문의 답변, 리뷰 답글, 블로그 콘텐츠를 AI가 처리하고 사장님은 승인만.", href: "https://aura-project-delta.vercel.app", external: true, scene: AuraScene },
  { no: "06", title: "틈워크", en: "AI × expert workflow", desc: "한 건의 일을 단계로 쪼개 단순 작업은 AI가, 판단은 전문가가 맡는 분업 플랫폼.", href: "https://teum.seroai.xyz", external: true, scene: TeumScene },
];

export default function PortfolioShowcase({ lh }: { lh: (href: string) => string }) {
  return (
    <>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ no, title, en, desc, href, external, scene: Scene }) => (
          <a
            key={no}
            href={external || href.startsWith("/demo") ? href : lh(href)}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="pf-card group block rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,.35)]"
          >
            <div className="pf-stage" aria-hidden="true">
              <Scene />
            </div>
            <div className="px-2 pb-2 pt-5">
              <h3 className="text-[1.15rem] font-black tracking-[-0.03em] text-ink">
                <span className="pf-no">{no}</span> {title}
              </h3>
              <p className="text-[12.5px] font-semibold text-ink-3">{en}</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-ink">
                직접 보기 <Icon name="arrowRight" className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </div>
          </a>
        ))}
      </div>
      <a href="#contact" className="pf-next mt-5 flex items-center justify-between gap-4 rounded-3xl bg-ink px-7 py-6 text-bg">
        <span>
          <span className="block text-[13px] font-semibold text-bg/60">07</span>
          <span className="text-[1.25rem] font-black tracking-[-0.03em]">다음 작업은 사장님 가게입니다</span>
        </span>
        <span className="pf-plus" aria-hidden="true">+</span>
      </a>
    </>
  );
}
