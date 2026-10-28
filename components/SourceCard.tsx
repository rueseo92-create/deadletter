import type { SourceLink } from "@/lib/posts";
import { Icon } from "@/components/Icon";

const typeLabel: Record<string, string> = {
  government: "공공기관",
  paper: "논문·보고서",
  news: "뉴스",
  official: "공식 문서",
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function SourceCard({ source, index }: { source: SourceLink; index?: number }) {
  const label = typeLabel[source.type || ""] || "출처";
  const host = hostOf(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
    >
      {index !== undefined && (
        <span className="mt-px w-5 flex-shrink-0 text-[12px] font-semibold tabular-nums text-ink-3">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="card-title block truncate text-[14px] font-semibold text-ink">{source.name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-ink-3">
          {label}
          {host && <> · {host}</>}
        </span>
      </span>
      <Icon name="external" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-3 group-hover:text-ink" />
    </a>
  );
}
