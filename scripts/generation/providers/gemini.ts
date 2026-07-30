import { GenerationPromptOptions, LLMProvider, ProviderResponse } from './index';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  async generateQuestions(options: GenerationPromptOptions): Promise<ProviderResponse> {
    if (!this.apiKey && !options.dryRun) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    const prompt = this.buildPrompt(options);
    const PROMPT_VERSION = "v1";

    if (options.dryRun) {
      console.log(`[Dry Run] Would generate ${options.count} questions for "${options.categoryName}"`);
      console.log(`[Dry Run] Estimated prompt length: ${prompt.length} characters.`);
      return { questions: [] };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Invalid response from Gemini API');
    }

    try {
      const parsed = JSON.parse(text);
      // Gemini might wrap in an object or just return array based on our prompt.
      // We'll enforce the prompt to return an object with a 'questions' array.
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
          throw new Error('Response did not contain a "questions" array');
      }
      
      const generatedAt = new Date().toISOString();
      
      // Map to ensure stable IDs and default approved status
      parsed.questions = parsed.questions.map((q: any, i: number) => ({
        ...q,
        id: `know_me_${options.categorySlug.replace(/-/g, '_')}_${Date.now()}_${i}`,
        category_id: options.categoryId,
        category_slug: options.categorySlug,
        answer_type: 'multiple_choice',
        approved: false, // Default to false for human review
        metadata: {
          generator: this.name,
          generated_at: generatedAt,
          prompt_version: PROMPT_VERSION
        }
      }));

      return parsed as ProviderResponse;
    } catch (e: any) {
      console.error("Failed to parse JSON from Gemini:", text);
      throw new Error(`JSON parse error: ${e.message}`);
    }
  }

  private buildPrompt(options: GenerationPromptOptions): string {
    const existingList = options.existingQuestions.length > 0 
      ? \`Avoid questions too similar to these existing ones:\n\${options.existingQuestions.slice(0, 20).map(q => \`- \${q}\`).join('\\n')}\`
      : '';

    return \`
You are an expert game designer creating questions for a couple's relationship app (like 'Know Me' or 'The Newlywed Game').

Task: Generate exactly \${options.count} unique, high-quality questions for the category "\${options.categoryName}".
Category Description: \${options.categoryDescription}

Guidelines:
1. Tone: Fun, wholesome, deep, and conversational. Use "I/me" (e.g., "What is my favorite...", "How do I..."). DO NOT use placeholders like "your partner".
2. Options: Provide exactly 4 multiple-choice options. They should be realistic, relatable, and cover distinct possibilities.
3. Difficulty: Classify each question as 'easy', 'medium', or 'deep'.
4. Tags: Assign 1-3 tags from this exact list: ["future", "travel", "career", "family", "food", "movies", "music", "childhood", "romance", "communication", "dreams", "intimacy", "funny", "habits", "values", "hypothetical"].

\${existingList}

Respond strictly in JSON format matching this schema:
{
  "questions": [
    {
      "question_text": "string",
      "options": ["string", "string", "string", "string"],
      "difficulty": "easy | medium | deep",
      "tags": ["string"]
    }
  ]
}
\`;
  }
}
