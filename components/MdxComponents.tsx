import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

// "> 핵심 답변: ..." / "> 핵심: ..." / "> 꿀팁: ..." 형태의 인용문을 라벨이 달린 콜아웃으로 렌더링
const CALLOUT_RE = /^\s*(핵심 답변|핵심 요약|핵심|꿀팁|팁|주의|참고|요약|결론|TL;DR)\s*[:：]\s*/;

type WithChildren = { children?: ReactNode };

function labelFromFirstChild(kids: ReactNode[]): { label: string; rest: ReactNode[] } | null {
  const first = kids[0];
  if (typeof first === "string") {
    const m = CALLOUT_RE.exec(first);
    if (m) return { label: m[1], rest: [first.slice(m[0].length), ...kids.slice(1)] };
    return null;
  }
  // **핵심 답변:** 처럼 굵게 처리된 라벨
  if (isValidElement<WithChildren>(first) && typeof first.props.children === "string") {
    const text = first.props.children.trim();
    const m = /^(.{1,8}?)\s*[:：]?$/.exec(text);
    if (m && CALLOUT_RE.test(`${m[1]}:`)) {
      const next = kids[1];
      const rest = typeof next === "string" ? [next.replace(/^\s*[:：]?\s*/, ""), ...kids.slice(2)] : kids.slice(1);
      return { label: m[1], rest };
    }
  }
  return null;
}

function Blockquote({ children }: WithChildren) {
  const arr = Children.toArray(children);
  const idx = arr.findIndex((c) => isValidElement(c));
  if (idx >= 0) {
    const p = arr[idx] as ReactElement<WithChildren>;
    const found = labelFromFirstChild(Children.toArray(p.props.children));
    if (found) {
      arr[idx] = cloneElement(
        p,
        {},
        <span className="callout-label" key="label">
          {found.label}
        </span>,
        ...found.rest
      );
      return <blockquote data-callout={found.label}>{arr}</blockquote>;
    }
  }
  return <blockquote>{children}</blockquote>;
}

function Table(props: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrap" role="region" aria-label="표 (가로로 스크롤할 수 있습니다)" tabIndex={0}>
      <table {...props} />
    </div>
  );
}

function H1(props: React.HTMLAttributes<HTMLHeadingElement>) {
  // 본문 안의 h1 은 페이지 제목과 중복되므로 h2 로 강등
  return <h2 {...props} />;
}

function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" decoding="async" {...props} alt={props.alt || ""} />;
}

export const mdxComponents = {
  blockquote: Blockquote,
  table: Table,
  h1: H1,
  img: Img,
};
