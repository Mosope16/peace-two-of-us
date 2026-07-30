export type Difficulty = 'easy' | 'medium' | 'deep';

export type ControlledTag = 
  | 'future' | 'travel' | 'career' | 'family' 
  | 'food' | 'movies' | 'music' | 'childhood' 
  | 'romance' | 'communication' | 'dreams' | 'intimacy'
  | 'funny' | 'habits' | 'values' | 'hypothetical';

export interface GeneratedQuestion {
  id: string; // e.g. know_me_long_distance_001
  category_id: string;
  category_slug: string; // Used for file naming
  question_text: string;
  answer_type: 'multiple_choice';
  options: string[]; // exactly 4 options
  difficulty: Difficulty;
  tags: ControlledTag[];
  approved: boolean;
}

export interface ProviderResponse {
  questions: GeneratedQuestion[];
}

export interface GenerationPromptOptions {
  categoryName: string;
  categoryDescription: string;
  categorySlug: string;
  categoryId: string;
  count: number;
  existingQuestions: string[]; // To avoid duplicates in the prompt context
}

export interface LLMProvider {
  name: string;
  generateQuestions(options: GenerationPromptOptions): Promise<ProviderResponse>;
}
