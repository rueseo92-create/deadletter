import type { LetterCategory, LetterEmotion } from "@/types/database";

export interface CategoryInfo {
  value: LetterCategory;
  label: string;
  emoji: string;
  complement?: LetterCategory; // 매칭 시 보완 카테고리
}

export interface EmotionInfo {
  value: LetterEmotion;
  label: string;
  color: string; // tailwind color class
}

export const CATEGORIES: CategoryInfo[] = [
  { value: "ex_lover", label: "전 연인에게", emoji: "💔", complement: "ex_lover" },
  { value: "parent", label: "부모님에게", emoji: "🏠", complement: "child" },
  { value: "child", label: "자녀에게", emoji: "🌱", complement: "parent" },
  { value: "friend", label: "친구에게", emoji: "🤝", complement: "friend" },
  { value: "younger_self", label: "과거의 나에게", emoji: "🪞", complement: "future_self" },
  { value: "future_self", label: "미래의 나에게", emoji: "🔮", complement: "younger_self" },
  { value: "deceased", label: "떠난 사람에게", emoji: "🕊️", complement: "deceased" },
  { value: "someone_who_hurt", label: "나를 아프게 한 사람에게", emoji: "🩹", complement: "someone_who_hurt" },
  { value: "mentor", label: "은사님에게", emoji: "📚", complement: "mentor" },
  { value: "stranger", label: "모르는 누군가에게", emoji: "🌊", complement: "stranger" },
  { value: "other", label: "그 밖의 누군가에게", emoji: "✉️", complement: "other" },
];

export const EMOTIONS: EmotionInfo[] = [
  { value: "regret", label: "후회", color: "text-amber-400" },
  { value: "gratitude", label: "감사", color: "text-emerald-400" },
  { value: "anger", label: "분노", color: "text-red-400" },
  { value: "longing", label: "그리움", color: "text-indigo-400" },
  { value: "forgiveness", label: "용서", color: "text-sky-400" },
  { value: "confession", label: "고백", color: "text-pink-400" },
  { value: "grief", label: "슬픔", color: "text-slate-400" },
  { value: "hope", label: "희망", color: "text-yellow-300" },
  { value: "apology", label: "사과", color: "text-violet-400" },
  { value: "love", label: "사랑", color: "text-rose-400" },
];

export function getCategoryInfo(value: LetterCategory): CategoryInfo {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function getEmotionInfo(value: LetterEmotion): EmotionInfo {
  return EMOTIONS.find((e) => e.value === value) ?? EMOTIONS[0];
}

export function getComplementCategory(category: LetterCategory): LetterCategory {
  const info = getCategoryInfo(category);
  return info.complement ?? category;
}
