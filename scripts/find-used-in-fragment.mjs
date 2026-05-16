import fs from 'fs';

const frag = fs.readFileSync('src/screens/module/_modulePanelFragment.txt', 'utf8');
const hook = fs.readFileSync('src/hooks/useStaffPortalModel.ts', 'utf8');
const m = hook.match(/return \{([\s\S]*?)\n  \};\n\}/);
if (!m) throw new Error('no return');
const keys = m[1]
  .split('\n')
  .map((l) => l.trim().replace(/,$/, ''))
  .filter(Boolean);

const used = new Set();
for (const k of keys) {
  const re = new RegExp(`\\b${k}\\b`);
  if (re.test(frag)) used.add(k);
}
const list = [...used].sort();
fs.writeFileSync('src/screens/module/_usedKeys.txt', list.join('\n'), 'utf8');
console.log('used count', list.length);
