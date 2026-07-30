import * as fs from 'fs';
import * as path from 'path';
import { GeneratedQuestion } from './providers/index';

const GENERATED_DIR = path.join(process.cwd(), 'generated', 'know-me');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts', 'seed', 'generated-know-me.ts');

function compile() {
  if (!fs.existsSync(GENERATED_DIR)) {
    console.log('No generated directory found.');
    return;
  }

  const files = fs.readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
  let compiledQuestions: any[] = [];
  let totalApproved = 0;
  let totalPending = 0;

  for (const file of files) {
    const filePath = path.join(GENERATED_DIR, file);
    const data: GeneratedQuestion[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const q of data) {
      if (q.approved) {
        compiledQuestions.push({
          category_id: q.category_id,
          question_text: q.question_text,
          answer_type: q.answer_type || 'multiple_choice',
          options: q.options,
          difficulty: q.difficulty,
          tags: q.tags
        });
        totalApproved++;
      } else {
        totalPending++;
      }
    }
  }

  const fileContent = \`// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Run 'npx tsx scripts/generation/compile.ts' to regenerate this file from approved JSONs.

export const generatedKnowMeQuestions = \${JSON.stringify(compiledQuestions, null, 2)};
\`;

  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
  console.log(\`✅ Compiled \${totalApproved} approved questions to \${OUTPUT_FILE}\`);
  if (totalPending > 0) {
    console.log(\`⚠️ There are \${totalPending} pending questions awaiting approval in JSON files.\`);
  }
}

compile();
