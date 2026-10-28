import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isActiveCategory } from "./config";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

// ── 60개 고유 Unsplash 썸네일 풀 (중복 없는 1:1 할당) ──
const THUMBNAIL_POOL: string[] = [
  // AI / 테크
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
  "https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
  "https://images.unsplash.com/photo-1550645612-83f5d594b671?w=800&q=80",
  // 비즈니스 / 오피스
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=800&q=80",
  "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80",
  "https://images.unsplash.com/photo-1577415124269-fc1140a69e91?w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
  // 개발 / 코딩
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80",
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
  // 마케팅 / 데이터
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&q=80",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
  "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80",
  "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1596558450268-9c27524ba856?w=800&q=80",
  // 사이언스 / 혁신
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80",
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80",
  // 인프라 / 클라우드
  "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=800&q=80",
  "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=800&q=80",
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
  "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=800&q=80",
  // 스타트업 / 팀워크
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
  "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800&q=80",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
  // 헬스케어 / 리서치
  "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80",
  "https://images.unsplash.com/photo-1581093458791-9d42e3c2fd75?w=800&q=80",
  "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80",
  "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&q=80",
  // 디지털 / 모바일
  "https://images.unsplash.com/photo-1569017388730-020b5f80a004?w=800&q=80",
  "https://images.unsplash.com/photo-1512756290469-ec264b7fbf87?w=800&q=80",
];

// 프로덕션 빌드/런타임에서는 콘텐츠가 배포물과 함께 고정되므로 메모이즈한다.
// (개발 모드에서는 새 글이 바로 보이도록 매번 읽는다)
const SHOULD_CACHE = process.env.NODE_ENV === "production";

let sortedSlugCache: string[] | null = null;
function sortedSlugs(): string[] {
  if (SHOULD_CACHE && sortedSlugCache) return sortedSlugCache;
  const slugs = fs.existsSync(POSTS_DIR)
    ? fs
        .readdirSync(POSTS_DIR)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, ""))
        .sort()
    : [];
  if (SHOULD_CACHE) sortedSlugCache = slugs;
  return slugs;
}

/**
 * 포스트별 고유 썸네일 할당 (중복 절대 없음)
 * 전체 슬러그를 알파벳순 정렬 → 인덱스 기반 1:1 매핑
 */
function autoThumbnail(slug: string): string {
  const idx = sortedSlugs().indexOf(slug);
  return THUMBNAIL_POOL[(idx >= 0 ? idx : 0) % THUMBNAIL_POOL.length];
}

/** 슬롭 킬러(10인 검수 패널) 결과 — 새 파이프라인 글에만 존재 */
export interface ReviewMeta {
  panel: number;
  passed: number;
  score?: number;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  sources?: SourceLink[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  tldr?: string;
  published: boolean;
  language?: "ko" | "en";
  review?: ReviewMeta;
  /** 현재 운영 카테고리(ai-*)가 아닌 이전 주제 글 — 목록/피드/사이트맵에서 제외 */
  archived: boolean;
}

export interface SourceLink {
  name: string;
  url: string;
  type?: string; // "government" | "paper" | "news" | "official"
}

export interface Post {
  meta: PostMeta;
  content: string;
}

function parseReview(raw: unknown): ReviewMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const panel = Number(r.panel);
  const passed = Number(r.passed);
  if (!Number.isFinite(panel) || !Number.isFinite(passed) || panel <= 0) return undefined;
  const score = r.score !== undefined ? Number(r.score) : undefined;
  return { panel, passed, ...(Number.isFinite(score) ? { score } : {}) };
}

function toMeta(slug: string, data: Record<string, any>): PostMeta {
  const category = data.category || "";
  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date:
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 19)
        : data.date
        ? String(data.date)
        : "",
    category,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    thumbnail: data.thumbnail || autoThumbnail(slug),
    sources: Array.isArray(data.sources) ? data.sources : [],
    difficulty: data.difficulty || undefined,
    tldr: data.tldr || undefined,
    published: data.published !== false,
    language: data.language || "ko",
    review: parseReview(data.review),
    archived: !isActiveCategory(category),
  };
}

let allMetaCache: PostMeta[] | null = null;

/** 보관 글 포함, 발행된 전체 글 (최신순) */
function readAllMeta(): PostMeta[] {
  if (SHOULD_CACHE && allMetaCache) return allMetaCache;
  if (!fs.existsSync(POSTS_DIR)) return [];

  const metas = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      return toMeta(slug, matter(raw).data);
    })
    .filter((p) => p.published)
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0 && !Number.isNaN(dateDiff)) return dateDiff;
      return b.slug.localeCompare(a.slug);
    });

  if (SHOULD_CACHE) allMetaCache = metas;
  return metas;
}

/**
 * 현재 운영 중인 글 목록 (최신순, locale 필터 지원)
 * 보관 글(이전 주제)은 제외된다. 보관 글까지 필요하면 includeArchived 사용.
 */
export function getAllPosts(
  locale?: "ko" | "en",
  opts: { includeArchived?: boolean } = {}
): PostMeta[] {
  return readAllMeta()
    .filter((p) => opts.includeArchived || !p.archived)
    .filter((p) => !locale || (p.language || "ko") === locale);
}

// 개별 포스트 (보관 글도 반환 — URL은 계속 살아 있어야 함)
export function getPost(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { meta: toMeta(slug, data), content };
}

// 카테고리별 포스트 (locale 필터 지원)
export function getPostsByCategory(category: string, locale?: "ko" | "en"): PostMeta[] {
  if (!isActiveCategory(category)) return [];
  return getAllPosts(locale).filter((p) => p.category === category);
}

// 관련 포스트 (같은 카테고리 + 태그 겹치는 것, 보관 글 제외)
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const current = getPost(slug);
  if (!current) return [];

  const all = getAllPosts().filter((p) => p.slug !== slug);

  return all
    .map((p) => {
      let score = 0;
      if (p.category === current.meta.category) score += 2;
      score += p.tags.filter((t) => current.meta.tags.includes(t)).length;
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.post);
}

// 전체 슬러그 목록 (정적 생성용 — 보관 글 포함)
export function getAllSlugs(): string[] {
  return sortedSlugs();
}

/** "2026-10-28T14:24:11" → "2026.10.28" */
export function formatDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  return m ? `${m[1]}.${m[2]}.${m[3]}` : date;
}

/** 날짜 부분만 (ISO) — <time dateTime> 용 */
export function isoDate(date: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(date || "");
  return m ? m[1] : date;
}

export function estimateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((koreanChars / 500 + words / 200) / 2));
}
