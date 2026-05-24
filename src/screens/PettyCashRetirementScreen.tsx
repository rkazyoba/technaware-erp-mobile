import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { beginStaffFinanceRetirement } from '../api';
import { Text } from '../components/AppTypography';
import { colors } from '../constants/colors';
import { outfit } from '../constants/typography';
import { useStaffPortal } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from '../navigation/moduleStackTypes';

/** Legacy entry: opens retirement workspace after creating/resuming draft. */
export function PettyCashRetirementScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PettyCashRetirement'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule } = useStaffPortal();
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Imprest retirements');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await beginStaffFinanceRetirement(token, route.params.recordId);
        if (cancelled) return;
        navigation.replace('StaffFinanceRetirementWorkspace', {
          retirementId: res.data.id,
          imprestId: route.params.recordId,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not open retirement.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, route.params.recordId, navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      {error ? (
        <Text style={{ ...outfit('regular', 14), color: colors.trendDown, textAlign: 'center' }}>{error}</Text>
      ) : (
        <ActivityIndicator color={colors.accentTeal} />
      )}
    </View>
  );
}
