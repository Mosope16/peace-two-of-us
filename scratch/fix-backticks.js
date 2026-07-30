const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('\\`') || content.includes('\\\\n')) {
    content = content.split('\\`').join('`');
    content = content.split('\\\\n').join('\\n');
    content = content.split('\\${').join('${');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

const dir = path.join(__dirname, '../scripts/generation');
const subDirs = ['', 'providers'];

for (const sub of subDirs) {
  const p = path.join(dir, sub);
  if (fs.existsSync(p)) {
    const files = fs.readdirSync(p);
    for (const file of files) {
      if (file.endsWith('.ts')) {
        fixFile(path.join(p, file));
      }
    }
  }
}
