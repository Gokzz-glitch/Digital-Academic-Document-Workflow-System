const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules') continue;
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      if (c.includes('\`')) {
        c = c.replace(/\`/g, '`');
        fs.writeFileSync(p, c);
        console.log('Fixed', p);
      }
    }
  }
}
walk(process.cwd());
