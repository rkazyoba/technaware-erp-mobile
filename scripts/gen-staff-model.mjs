import fs from 'fs';

const srcPath = 'src/hooks/useStaffPortalModel.ts';
const t = fs.readFileSync(srcPath, 'utf8');
const i = t.indexOf('export function useStaffPortalModel');
if (i < 0) {
  console.error('Could not find useStaffPortalModel');
  process.exit(1);
}
console.log('Staff portal model source:', srcPath, 'offset', i);
