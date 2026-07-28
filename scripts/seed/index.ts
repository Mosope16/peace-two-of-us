import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { games } from './games';
import { knowMeCategories, knowMeQuestions } from './know-me';
import { iqDuelQuestions } from './iq-duel';
import { riddleQuestions } from './riddles';
import { thisOrThatQuestions } from './this-or-that';
import { wouldYouRatherQuestions } from './would-you-rather';

// Minimalistic env loader to avoid extra dependencies
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function createStableQuestionId(gameId: string | undefined, categoryId: string | undefined, questionText: string) {
  const seed = [gameId ?? '', categoryId ?? '', questionText].join('::');
  const hash = createHash('sha1').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function seed() {
  console.log('🚀 Starting seed process...');

  // 1. Seed Games
  console.log('Seeding games...');
  const { data: seededGames, error: gamesError } = await supabase
    .from('games')
    .upsert(games.map(g => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      questions_per_round: g.questions_per_round,
      time_limit_seconds: g.time_limit_seconds
    })), { onConflict: 'slug' })
    .select();

  if (gamesError) {
    console.error('❌ Error seeding games:', gamesError);
    return;
  }
  console.log(`✅ Seeded ${seededGames?.length} games.`);

  const gameMap = new Map(seededGames?.map(g => [g.slug, g.id]));

  // 2. Seed Categories
  console.log('Seeding categories...');
  const categoriesToSeed = knowMeCategories.map(c => {
    const { game_slug, ...catData } = c;
    return {
      ...catData,
      game_id: gameMap.get(game_slug)
    };
  });

  const { data: seededCategories, error: categoriesError } = await supabase
    .from('game_categories')
    .upsert(categoriesToSeed, { onConflict: 'id' })
    .select();

  if (categoriesError) {
    console.error('❌ Error seeding categories:', categoriesError);
    return;
  }
  console.log(`✅ Seeded ${seededCategories?.length} categories.`);

  // 3. Seed Questions
  console.log('Seeding questions...');

  const allQuestions = [
    ...knowMeQuestions.map(q => ({
      id: createStableQuestionId(gameMap.get('know-me'), q.category_id, q.question_text),
      ...q,
      game_id: gameMap.get('know-me')
    })),
    ...iqDuelQuestions.map(q => {
      const { game_slug, ...qData } = q;
      return {
        id: createStableQuestionId(gameMap.get(game_slug), undefined, qData.question_text),
        ...qData,
        game_id: gameMap.get(game_slug)
      };
    }),
    ...riddleQuestions.map(q => {
      const { game_slug, ...qData } = q;
      return {
        id: createStableQuestionId(gameMap.get(game_slug), undefined, qData.question_text),
        ...qData,
        game_id: gameMap.get(game_slug)
      };
    }),
    ...thisOrThatQuestions.map(q => {
      const { game_slug, ...qData } = q;
      return {
        id: createStableQuestionId(gameMap.get(game_slug), undefined, qData.question_text),
        ...qData,
        game_id: gameMap.get(game_slug)
      };
    }),
    ...wouldYouRatherQuestions.map(q => {
      const { game_slug, ...qData } = q;
      return {
        id: createStableQuestionId(gameMap.get(game_slug), undefined, qData.question_text),
        ...qData,
        game_id: gameMap.get(game_slug)
      };
    }),
  ];

  const { error: questionsError } = await supabase
    .from('questions')
    .upsert(allQuestions, { onConflict: 'id' });

  if (questionsError) {
    console.error('❌ Error seeding questions:', questionsError);
    return;
  }

  console.log(`✅ Seeded ${allQuestions.length} questions.`);
  console.log('✨ Seed process completed successfully!');
}

seed().catch(err => {
  console.error('💥 Fatal seed error:', err);
  process.exit(1);
});
