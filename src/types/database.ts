export type LetterCategory =
  | "ex_lover"
  | "parent"
  | "child"
  | "friend"
  | "younger_self"
  | "future_self"
  | "deceased"
  | "someone_who_hurt"
  | "mentor"
  | "stranger"
  | "other";

export type LetterEmotion =
  | "regret"
  | "gratitude"
  | "anger"
  | "longing"
  | "forgiveness"
  | "confession"
  | "grief"
  | "hope"
  | "apology"
  | "love";

export interface Profile {
  id: string;
  created_at: string;
  is_premium: boolean;
  premium_until: string | null;
  letters_written: number;
  letters_received: number;
  daily_count: number;
  daily_date: string;
}

export interface Letter {
  id: string;
  letter_number: number;
  author_id: string;
  recipient_label: string;
  category: LetterCategory;
  emotion: LetterEmotion;
  body: string;
  language: string;
  is_published: boolean;
  is_crisis: boolean;
  likes: number;
  views: number;
  reply_count: number;
  matched_letter_id: string | null;
  created_at: string;
}

export interface Reply {
  id: string;
  letter_id: string;
  author_id: string;
  body: string;
  likes: number;
  created_at: string;
}

export interface DailyLetter {
  id: string;
  user_id: string;
  letter_id: string;
  assigned_date: string;
  is_read: boolean;
  letter?: Letter;
}

export function displayId(num: number): string {
  return `DL-${String(num).padStart(4, "0")}`;
}
