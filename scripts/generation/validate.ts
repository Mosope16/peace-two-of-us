import * as fs from 'fs';
import * as path from 'path';
import { GeneratedQuestion, ControlledTag, Difficulty } from './providers/index';
import { knowMeQuestions } from '../seed/know-me';

const GENERATED_DIR = path.join(process.cwd(), 'generated', 'know-me');

// Simple Levenshtein distance for string similarity
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }

  return matrix[a.length][b.length];
}

// Calculate similarity percentage (0 to 1)
function similarity(a: string, b: string): number {
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'deep'];
const VALID_TAGS: ControlledTag[] = [
  'future', 'travel', 'career', 'family', 'food', 'movies', 'music', 
  'childhood', 'romance', 'communication', 'dreams', 'intimacy', 
  'funny', 'habits', 'values', 'hypothetical'
];
const FORBIDDEN_WORDS = ['your partner', 'boyfriend', 'girlfriend', 'husband', 'wife'];

function validateQuestion(q: GeneratedQuestion, existingTexts: string[]): string[] {
  const errors: string[] = [];

  // Schema checks
  if (!q.id) errors.push('Missing ID');
  if (!q.question_text || q.question_text.length < 10) errors.push('Question text too short or missing');
  if (!q.options || q.options.length !== 4) errors.push('Must have exactly 4 options');
  if (!VALID_DIFFICULTIES.includes(q.difficulty)) errors.push(\`Invalid difficulty: \${q.difficulty}\`);
  if (!q.tags || !Array.isArray(q.tags) || q.tags.length === 0) {
    errors.push('Missing tags');
  } else {
    for (const tag of q.tags) {
      if (!VALID_TAGS.includes(tag)) errors.push(\`Invalid tag: \${tag}\`);
    }
  }

  // Quality checks
  const lowerText = q.question_text.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word)) {
      errors.push(\`Contains forbidden phrase: "\${word}"\`);
    }
  }

  // Similarity check
  for (const existing of existingTexts) {
    const sim = similarity(q.question_text, existing);
    if (sim > 0.8) {
      errors.push(\`Too similar (\${(sim * 100).toFixed(0)}%) to existing: "\${existing}"\`);
      break;
    }
  }

  return errors;
}

function runValidation() {
  if (!fs.existsSync(GENERATED_DIR)) {
    console.log('No generated directory found. Run generation first.');
    return;
  }

  const files = fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
  let totalValid = 0;
  let totalErrors = 0;

  for (const file of files) {
    const filePath = path.join(GENERATED_DIR, file);
    const data: GeneratedQuestion[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (data.length === 0) continue;

    const categoryId = data[0]?.category_id;
    
    // Seed questions for this category
    const seedTexts = knowMeQuestions
      .filter(q => q.category_id === categoryId)
      .map(q => q.question_text);

    console.log(\`\\n🔍 Validating \${file} (\${data.length} questions)...\`);

    let categoryValid = 0;
    const existingTextsForCategory = [...seedTexts];

    // Linting stats
    let startsWithWhat = 0;
    const difficulties = { easy: 0, medium: 0, deep: 0 };
    const openingPhrases: Record<string, number> = {};

    for (const q of data) {
      const errors = validateQuestion(q, existingTextsForCategory);
      if (errors.length > 0) {
        console.log(\`❌ [\${q.id}] \${q.question_text}\`);
        errors.forEach(e => console.log(\`   - \${e}\`));
        totalErrors++;
      } else {
        existingTextsForCategory.push(q.question_text);
        categoryValid++;
        totalValid++;

        // Track lint stats for valid questions
        if (q.difficulty && difficulties[q.difficulty] !== undefined) {
          difficulties[q.difficulty]++;
        }
        
        const lowerQ = q.question_text.toLowerCase();
        if (lowerQ.startsWith("what's") || lowerQ.startsWith("what is")) {
          startsWithWhat++;
        }

        const firstTwoWords = lowerQ.split(' ').slice(0, 2).join(' ');
        if (firstTwoWords) {
          openingPhrases[firstTwoWords] = (openingPhrases[firstTwoWords] || 0) + 1;
        }
      }
    }
    
    console.log(\`✅ \${categoryValid} / \${data.length} valid in \${file}\`);

    // Lint Warnings
    const lintWarnings: string[] = [];
    if (startsWithWhat > (categoryValid * 0.4)) {
      lintWarnings.push(\`Too many questions start with "What's/What is" (\${startsWithWhat}/\${categoryValid})\`);
    }
    
    // Difficulty balance
    const maxDiff = Math.max(...Object.values(difficulties));
    const minDiff = Math.min(...Object.values(difficulties));
    if (categoryValid > 15 && maxDiff > (minDiff * 3 + 5)) {
       lintWarnings.push(\`Unbalanced difficulty distribution (Easy: \${difficulties.easy}, Medium: \${difficulties.medium}, Deep: \${difficulties.deep})\`);
    }

    // Repeated phrases
    const repeatedPhrases = Object.entries(openingPhrases)
      .filter(([phrase, count]) => count > (categoryValid * 0.3) && categoryValid > 10);
    if (repeatedPhrases.length > 0) {
      repeatedPhrases.forEach(([phrase, count]) => {
        lintWarnings.push(\`Repetitive opening phrase: "\${phrase}..." appears \${count} times.\`);
      });
    }

    if (lintWarnings.length > 0) {
      console.log(\`   ⚠️ Lint Warnings:\`);
      lintWarnings.forEach(w => console.log(\`      - \${w}\`));
    }
  }

  console.log(\`\\n--- Validation Summary ---\`);
  console.log(\`Total Valid: \${totalValid}\`);
  console.log(\`Total Errors: \${totalErrors}\`);
  if (totalErrors > 0) {
    console.log('⚠️ Please review the errors, fix them in the JSON files, or delete the bad questions.');
  }
}

runValidation();
