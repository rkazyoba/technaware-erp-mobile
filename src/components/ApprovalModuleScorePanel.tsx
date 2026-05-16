import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import type { ApprovalModuleScore } from '../api';
import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import { moduleColorStyles } from '../constants/modulePresentation';
import { outfit } from '../constants/typography';
import { approvalKindMeta } from '../utils/approvalPortal';

type ApprovalModuleScorePanelProps = {
  total: number;
  modules: ApprovalModuleScore[];
  activeTypeFilter?: string;
  onSelectAll?: () => void;
  onSelectModule: (module: ApprovalModuleScore) => void;
  compact?: boolean;
};

export function ApprovalModuleScorePanel({
  total,
  modules,
  activeTypeFilter = 'All',
  onSelectAll,
  onSelectModule,
  compact = false,
}: ApprovalModuleScorePanelProps) {
  const withPending = modules.filter((m) => m.count > 0);

  if (total === 0 && withPending.length === 0) {
    return (
      <View
        style={{
          marginTop: compact ? 0 : 14,
          padding: 14,
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>All caught up</Text>
        <Text style={{ ...outfit('regular', 12), color: colors.textSecondary, marginTop: 6 }}>No documents are waiting for your approval.</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: compact ? 0 : 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text
          style={{
            ...outfit('medium', 11),
            color: colors.textMuted,
            letterSpacing: 0.66,
            textTransform: 'uppercase',
          }}
        >
          Pending by module
        </Text>
        {onSelectAll ? (
          <Pressable onPress={onSelectAll} hitSlop={8}>
            <Text style={{ ...outfit('medium', 12), color: colors.linkBlue }}>
              {activeTypeFilter === 'All' ? `All (${total})` : 'Show all'}
            </Text>
          </Pressable>
        ) : (
          <Text style={{ ...outfit('medium', 12), color: colors.statusPendingText }}>{total} total</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {withPending.map((mod) => {
          const meta = approvalKindMeta(mod.kind);
          const palette = moduleColorStyles(meta.colorFamily);
          const selected = activeTypeFilter === mod.type;

          return (
            <Pressable
              key={mod.kind}
              onPress={() => onSelectModule(mod)}
              style={{
                width: compact ? '47%' : '48%',
                minWidth: 140,
                flexGrow: 1,
                padding: 12,
                borderRadius: 14,
                backgroundColor: selected ? colors.primaryNavy : colors.surface,
                borderWidth: 0.5,
                borderColor: selected ? colors.primaryNavy : colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: selected ? 'rgba(255,255,255,0.15)' : palette.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={18} color={selected ? '#fff' : palette.fg} />
                </View>
                <View
                  style={{
                    minWidth: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: selected ? colors.accentTeal : colors.statusPendingBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ ...outfit('medium', 13), color: selected ? '#fff' : colors.statusPendingText }}>{mod.count}</Text>
                </View>
              </View>
              <Text
                style={{
                  ...outfit('medium', 12),
                  color: selected ? '#fff' : colors.textPrimary,
                  marginTop: 10,
                }}
                numberOfLines={2}
              >
                {mod.type}
              </Text>
              <Text style={{ ...outfit('regular', 10), color: selected ? 'rgba(255,255,255,0.7)' : colors.textMuted, marginTop: 4 }}>
                Tap to review
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
