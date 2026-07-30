import * as fs from 'fs';
import * as path from 'path';
import { knowMeCategories, knowMeQuestions } from '../seed/know-me';
import { GeminiProvider } from './providers/gemini';
import { LLMProvider } from './providers/index';

// Minimalistic env loader
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

const OUTPUT_DIR = path.join(process.cwd(), 'generated', 'know-me');

async function ensureDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function runGeneration(provider: LLMProvider, targetCategorySlug?: string, dryRun: boolean = false) {
  await ensureDirectory();

  // Filter categories if a specific one is provided
  const categories = targetCategorySlug 
    ? knowMeCategories.filter(c => c.game_slug === 'know-me' && c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetCategorySlug)
    : knowMeCategories.filter(c => c.game_slug === 'know-me');

  if (categories.length === 0) {
    console.error('No categories found.');
    return;
  }

  for (const category of categories) {
    const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    console.log(\`\\n--- Processing Category: \${category.name} ---\`);

    // Load existing questions for context (from seed and already generated)
    const seedQuestions = knowMeQuestions
      .filter(q => q.category_id === category.id)
      .map(q => q.question_text);
    
    let generatedQuestions: any[] = [];
    const outputFile = path.join(OUTPUT_DIR, \`\${slug}.json\`);
    
    if (fs.existsSync(outputFile)) {
      try {
        generatedQuestions = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      } catch (e) {
        console.warn(\`Could not parse existing file \${outputFile}. Starting fresh for this category.\`);
      }
    }

    const allExistingText = [...seedQuestions, ...generatedQuestions.map(q => q.question_text)];
    
    // We aim for 50 questions total.
    // If we already have some in the seed, we might only want to generate up to 50 total.
    // But for this script, let's assume we want to generate batches until the generated JSON has 50.
    const TARGET_GENERATED = 50;
    const currentGenerated = generatedQuestions.length;
    
    if (currentGenerated >= TARGET_GENERATED) {
      console.log(\`Already have \${currentGenerated} generated questions for \${category.name}. Skipping.\`);
      continue;
    }

    const needed = TARGET_GENERATED - currentGenerated;
    // Batch size of 10 as recommended
    const batchSize = Math.min(10, needed);
    
    console.log(\`Need \${needed} more questions. Generating a batch of \${batchSize}...\`);
    
    try {
      const response = await provider.generateQuestions({
        categoryId: category.id,
        categorySlug: slug,
        categoryName: category.name,
        categoryDescription: category.description,
        count: batchSize,
        existingQuestions: allExistingText,
        dryRun
      });

      if (response.questions && response.questions.length > 0) {
        const newQuestions = [...generatedQuestions, ...response.questions];
        fs.writeFileSync(outputFile, JSON.stringify(newQuestions, null, 2), 'utf-8');
        console.log(\`✅ Successfully generated and saved \${response.questions.length} questions to \${outputFile}\`);
      } else {
        console.log(\`⚠️ Provider returned no questions.\`);
      }

    } catch (e: any) {
      console.error(\`❌ Failed to generate batch for \${category.name}:\`, e.message);
    }
  }
}

// Example usage:
// Run with: npx tsx scripts/generation/index.ts
const provider = new GeminiProvider(); 
// You can switch providers here if you implement AnthropicProvider or OpenAIProvider

// Optionally pass a specific category slug as argument (e.g. 'long-distance')
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slugArg = args.find(a => !a.startsWith('--'));
runGeneration(provider, slugArg, dryRun);
