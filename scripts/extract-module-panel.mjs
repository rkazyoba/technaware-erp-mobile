import fs from 'fs';

const t = fs.readFileSync('src/screens/module/ModuleLegacyPanel.tsx', 'utf8');
console.log('ModuleLegacyPanel length', t.length);
