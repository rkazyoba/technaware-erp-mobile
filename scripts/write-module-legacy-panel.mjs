import fs from 'fs';

const hook = fs.readFileSync('src/hooks/useStaffPortalModel.ts', 'utf8');
const frag = fs.readFileSync('src/screens/module/_modulePanelFragment.txt', 'utf8');
const lines = hook.split(/\n/);

let start = -1;
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i].trim() === 'return {' && lines[i + 1]?.trim().startsWith('token,')) {
    start = i;
    break;
  }
}
if (start < 0) {
  throw new Error('Could not find model return block');
}

const keys = [];
for (let i = start + 1; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t === '};') break;
  if (!t) continue;
  const k = t.replace(/,$/, '').trim();
  if (k && !k.startsWith('//')) keys.push(k);
}

const header = `import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { ModuleSearchToolbar } from '../components/ModuleSearchToolbar';
import { StoreStrip } from '../components/StoreStrip';
import { useStaffPortal } from '../context/StaffPortalContext';
import { isLogisticsModule, logisticsPathFor } from '../hooks/useStaffPortalModel';
import { styles } from '../styles/appStyles';

export function ModuleLegacyPanel() {
  const sp = useStaffPortal();
  const {
${keys.map((k) => `    ${k},`).join('\n')}
  } = sp;

  return (
${frag}
  );
}
`;

fs.writeFileSync('src/screens/module/ModuleLegacyPanel.tsx', header, 'utf8');
console.log('keys', keys.length);
