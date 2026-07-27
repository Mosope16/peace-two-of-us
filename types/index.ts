export type MoodType = 'happy' | 'loved' | 'sad' | 'tired' | 'missing_you';

export interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  created_at: string;
}

export interface Couple {
  id: string;
  partner_one: User;
  partner_two: User | null;
  relationship_start_date: string;
  invite_code: string;
  is_connected: boolean;
}

export interface Memory {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  image_url?: string;
  date: string;
  created_by: string; // user_id
  created_at: string;
  category?: 'date' | 'trip' | 'milestone' | 'call' | 'surprise';
}

export interface LoveLetter {
  id: string;
  couple_id: string;
  title: string;
  content: string;
  unlock_date?: string; // ISO date string
  created_by: string; // user_id
  created_at: string;
  is_read?: boolean;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: MoodType;
  note?: string;
  created_at: string;
}

export interface BucketItem {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  category?: 'travel' | 'date' | 'life' | 'creative';
  created_by: string;
  created_at: string;
}

export interface Countdown {
  id: string;
  couple_id: string;
  title: string;
  target_date: string;
  category?: 'anniversary' | 'visit' | 'birthday' | 'graduation' | 'trip' | 'custom';
  icon?: string;
  created_by: string;
  created_at: string;
}

// GAMES TYPES
export type QuizCategoryId =
  | 'long_distance'
  | 'pop_culture'
  | 'most_likely_to'
  | 'cute'
  | 'after_dark'
  | 'spicy'
  | 'deep'
  | 'foodies'
  | 'firsts_memories'
  | 'silly_random'
  | 'adventure'
  | 'red_flags_icks'
  | 'throwback'
  | 'our_future'
  | 'secrets_confessions'
  | 'hot_takes'
  | 'what_if';

export interface QuizCategoryInfo {
  id: QuizCategoryId;
  title: string;
  emoji: string;
  description: string;
  is18Plus?: boolean;
  color: string;
  badgeBg: string;
}

export interface KnowMeQuestion {
  id: string;
  category: QuizCategoryId;
  question: string;
  options: string[];
}

export interface QuizAnswerRecord {
  user_id: string;
  option_index: number;
  updated_at: string;
}

export interface IQDuelQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeSeconds: number; // question clock
  isDoublePoints?: boolean; // final question bonus
}

export interface IQDuelAnswer {
  user_id: string;
  question_id: string;
  selected_index: number;
  time_taken: number;
  is_locked: boolean;
}

export interface Riddle {
  id: string;
  title: string;
  question: string;
  hint: string;
  answer: string;
  category: string;
}

export interface RiddleProgress {
  riddle_id: string;
  user_id: string;
  is_solved: boolean;
  solved_at?: string;
}

export interface LiveGameRoom {
  roomCode: string;
  couple_id: string;
  gameType: 'know-me' | 'iq-duel' | 'riddle-night';
  category?: QuizCategoryId;
  hostUserId: string;
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
}

