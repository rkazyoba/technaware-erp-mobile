import fs from 'fs';

const list = fs
  .readFileSync('scripts/extract-staff-model.mjs', 'utf8')
  .split('\n');
// read from useStaffPortalModel return section instead
const t = fs.readFileSync('src/hooks/useStaffPortalModel.ts', 'utf8');
const m = t.match(/return \{([\s\S]*)\n  \};\n\}/);
if (!m) throw new Error('no return');
const keys = m[1]
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => l.replace(/,$/, '').trim())
  .filter((l) => l && !l.startsWith('//'));

const destructure = `const {\n${keys.map((k) => `  ${k},`).join('\n')}\n} = useStaffPortalModel({
  token,
  user,
  portal,
  payrollTabVisible,
  activeTab,
  selectedModule,
  loading,
  onSetTab,
  onRefreshProfile,
  onLogout,
  onOpenAction,
});`;

fs.writeFileSync('scripts/destructure-snippet.txt', destructure, 'utf8');
console.log(keys.length);
