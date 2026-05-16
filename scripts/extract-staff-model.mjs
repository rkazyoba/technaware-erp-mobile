import fs from 'fs';

/** Legacy: state now lives in `src/hooks/useStaffPortalModel.ts`. */
const path = 'src/hooks/useStaffPortalModel.ts';
const t = fs.readFileSync(path, 'utf8');
const i = t.indexOf('export function useStaffPortalModel');
const j = t.indexOf('\n  return {', i);
if (i < 0 || j < 0) {
  console.error('Could not find useStaffPortalModel body');
  process.exit(1);
}
const brace = t.indexOf('{', i);
const body = t.slice(brace + 1, j).trimEnd();
const names = new Set();
for (const line of body.split('\n')) {
  let m = line.match(/^  const \[([^\]]+)\]/);
  if (m) {
    m[1]
      .split(',')
      .map((s) => s.trim().split('=')[0].trim())
      .forEach((n) => {
        if (/^[a-zA-Z_]/.test(n)) names.add(n);
      });
    continue;
  }
  m = line.match(/^  const (\w+)\s*=/);
  if (m) names.add(m[1]);
}
const list = [...names].sort();
console.log('source', path);
console.log('count', list.length);
console.log(list.join('\n'));
