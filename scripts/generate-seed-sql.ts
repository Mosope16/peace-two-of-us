import { 
  QUIZ_CATEGORIES, 
  KNOW_ME_QUESTIONS, 
  IQ_DUEL_CLASSIC_QUESTIONS, 
  IQ_DUEL_MARATHON_QUESTIONS, 
  RIDDLES_DATA, 
  THIS_OR_THAT_QUESTIONS, 
  WOULD_YOU_RATHER_QUESTIONS, 
  COMPATIBILITY_QUESTIONS 
} from '../lib/games-data';
import * as fs from 'fs';
import * as path from 'path';

function escapeSql(str: string) {
  return str.replace(/'/g, "''");
}

function main() {
  const sqlLines: string[] = [];
  sqlLines.push('-- Seed Data for Games, Categories, and Questions');
  sqlLines.push('BEGIN;');
  sqlLines.push('');

  // 1. Games
  const games = [
    { id: crypto.randomUUID(), slug: 'know-me', name: 'Know Me', questions_per_round: 5, time_limit: 'NULL' },
    { id: crypto.randomUUID(), slug: 'iq-duel', name: 'IQ Duel', questions_per_round: 7, time_limit: 30 },
    { id: crypto.randomUUID(), slug: 'this-or-that', name: 'This or That', questions_per_round: 10, time_limit: 'NULL' },
    { id: crypto.randomUUID(), slug: 'riddles', name: 'Riddle Night', questions_per_round: 5, time_limit: 'NULL' },
    { id: crypto.randomUUID(), slug: 'compatibility', name: 'Compatibility Quiz', questions_per_round: 5, time_limit: 'NULL' },
    { id: crypto.randomUUID(), slug: 'would-you-rather', name: 'Would You Rather', questions_per_round: 5, time_limit: 'NULL' },
  ];

  sqlLines.push('-- Insert Games');
  for (const g of games) {
    sqlLines.push(`INSERT INTO public.games (id, slug, name, questions_per_round, time_limit_seconds) VALUES ('${g.id}', '${g.slug}', '${escapeSql(g.name)}', ${g.questions_per_round}, ${g.time_limit}) ON CONFLICT (slug) DO NOTHING;`);
  }
  sqlLines.push('');

  // 2. Categories
  sqlLines.push('-- Insert Categories');
  const catMap = new Map<string, string>(); // legacy_id -> new uuid
  let displayOrder = 10;
  for (const cat of QUIZ_CATEGORIES) {
    const uuid = crypto.randomUUID();
    catMap.set(cat.id, uuid);
    // Note: We associate these categories with 'know-me' for now, or we can make them global by setting game_id to the know-me game id.
    const gameId = games.find(g => g.slug === 'know-me')?.id;
    sqlLines.push(`INSERT INTO public.game_categories (id, game_id, name, emoji, description, color, badge_bg, is_active, display_order) VALUES ('${uuid}', '${gameId}', '${escapeSql(cat.title)}', '${escapeSql(cat.emoji)}', '${escapeSql(cat.description)}', '${escapeSql(cat.color || '')}', '${escapeSql(cat.badgeBg || '')}', true, ${displayOrder});`);
    displayOrder += 10;
  }
  sqlLines.push('');

  // 3. Questions
  sqlLines.push('-- Insert Questions');

  // Know Me
  const knowMeGameId = games.find(g => g.slug === 'know-me')?.id;
  for (const q of KNOW_ME_QUESTIONS) {
    const catId = catMap.get(q.category);
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.questions (id, game_id, category_id, question_text, answer_type, options, is_adult) VALUES ('${crypto.randomUUID()}', '${knowMeGameId}', '${catId}', '${escapeSql(q.question)}', 'multiple_choice', '${optionsJson}', false);`);
  }

  // IQ Duel
  const iqDuelGameId = games.find(g => g.slug === 'iq-duel')?.id;
  for (const q of IQ_DUEL_MARATHON_QUESTIONS) {
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    const weight = q.isDoublePoints ? 2 : 1;
    sqlLines.push(`INSERT INTO public.questions (id, game_id, question_text, answer_type, options, correct_index, weight, is_adult) VALUES ('${crypto.randomUUID()}', '${iqDuelGameId}', '${escapeSql(q.question)}', 'multiple_choice', '${optionsJson}', ${q.correctIndex}, ${weight}, false);`);
  }

  // Riddles
  const riddlesGameId = games.find(g => g.slug === 'riddles')?.id;
  for (const q of RIDDLES_DATA) {
    // Storing the answer and hint in options for now
    const optionsJson = JSON.stringify({ answer: q.answer, hint: q.hint }).replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.questions (id, game_id, question_text, answer_type, options, is_adult) VALUES ('${crypto.randomUUID()}', '${riddlesGameId}', '${escapeSql(q.question)}', 'text', '${optionsJson}', false);`);
  }

  // This or That
  const totGameId = games.find(g => g.slug === 'this-or-that')?.id;
  for (const q of THIS_OR_THAT_QUESTIONS) {
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.questions (id, game_id, question_text, answer_type, options, is_adult) VALUES ('${crypto.randomUUID()}', '${totGameId}', '${escapeSql(q.question)}', 'this_or_that', '${optionsJson}', false);`);
  }

  // Would You Rather
  const wyrGameId = games.find(g => g.slug === 'would-you-rather')?.id;
  for (const q of WOULD_YOU_RATHER_QUESTIONS) {
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.questions (id, game_id, question_text, answer_type, options, is_adult) VALUES ('${crypto.randomUUID()}', '${wyrGameId}', '${escapeSql(q.question)}', 'this_or_that', '${optionsJson}', false);`);
  }

  // Compatibility
  const compGameId = games.find(g => g.slug === 'compatibility')?.id;
  for (const q of COMPATIBILITY_QUESTIONS) {
    const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
    sqlLines.push(`INSERT INTO public.questions (id, game_id, question_text, answer_type, options, is_adult) VALUES ('${crypto.randomUUID()}', '${compGameId}', '${escapeSql(q.question)}', 'multiple_choice', '${optionsJson}', false);`);
  }

  sqlLines.push('COMMIT;');

  const outPath = path.join(__dirname, '../supabase/seed_games.sql');
  fs.writeFileSync(outPath, sqlLines.join('\n'));
  console.log('Seed SQL generated at', outPath);
}

main();
