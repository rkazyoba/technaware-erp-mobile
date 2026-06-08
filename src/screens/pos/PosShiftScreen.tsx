import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Text } from '../../components/AppTypography';
import { TopBar, TopBarIconButton } from '../../components/TopBar';
import { closePosShift, getPosStandaloneSummary, openPosShift } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';
import { useStaffPortal } from '../../context/StaffPortalContext';
import type { ModulesStackParamList } from '../../navigation/moduleStackTypes';
import { openShiftForTerminal } from '../../utils/posPortal';

export function PosShiftScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ModulesStackParamList>>();
  const route = useRoute<RouteProp<ModulesStackParamList, 'PosShift'>>();
  const { token, setPortalActiveTab, setPortalSelectedModule, onPortalNotify } = useStaffPortal();

  const [openingFloat, setOpeningFloat] = useState('0');
  const [closingCount, setClosingCount] = useState('');
  const [notes, setNotes] = useState('');
  const [shiftId, setShiftId] = useState<number | undefined>(route.params.shiftId);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setPortalActiveTab('modules');
      setPortalSelectedModule('Retail POS');
    }, [setPortalActiveTab, setPortalSelectedModule]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      (async () => {
        setRefreshing(true);
        try {
          const res = await getPosStandaloneSummary(token);
          if (cancelled) return;
          const open = openShiftForTerminal(res.data.open_shifts, route.params.terminalId);
          setShiftId(open?.id);
        } finally {
          if (!cancelled) setRefreshing(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [token, route.params.terminalId]),
  );

  const inputStyle = {
    backgroundColor: colors.pageBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: colors.borderSubtle,
    ...outfit('regular', 14),
    color: colors.textPrimary,
  } as const;

  const onOpen = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await openPosShift(token, {
        terminal_id: route.params.terminalId,
        opening_float: parseFloat(openingFloat || '0') || 0,
      });
      onPortalNotify?.('Shift opened.', 'success');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not open shift', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onClose = async () => {
    if (!token || !shiftId) return;
    const count = parseFloat(closingCount);
    if (!Number.isFinite(count) || count < 0) {
      Alert.alert('Check form', 'Enter closing cash count.');
      return;
    }
    setLoading(true);
    try {
      const res = await closePosShift(token, {
        shift_id: shiftId,
        closing_cash_count: count,
        notes: notes.trim() || undefined,
      });
      const variance = res.data.shift.variance;
      onPortalNotify?.(
        variance !== undefined ? `Shift closed · variance ${Number(variance).toFixed(2)}` : 'Shift closed.',
        'success',
      );
      navigation.replace('PosZReport', {
        shiftId: res.data.shift.id ?? shiftId,
        terminalName: route.params.terminalName,
      });
    } catch (e) {
      Alert.alert('Could not close shift', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOpen = Boolean(shiftId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <TopBar
        title={route.params.terminalName}
        subtitle={isOpen ? 'Close shift' : 'Open shift'}
        left={<TopBarIconButton name="arrow-back" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {refreshing ? <ActivityIndicator color={colors.accentTeal} style={{ marginBottom: 12 }} /> : null}

        {!isOpen ? (
          <>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
              Record opening float in the drawer before your first sale.
            </Text>
            <Text style={{ ...outfit('medium', 13), marginBottom: 6 }}>Opening float</Text>
            <TextInput
              style={inputStyle}
              keyboardType="decimal-pad"
              value={openingFloat}
              onChangeText={setOpeningFloat}
            />
            <Pressable
              onPress={() => void onOpen()}
              disabled={loading}
              style={{
                backgroundColor: colors.primaryNavy,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>{loading ? 'Opening…' : 'Open shift'}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginBottom: 12 }}>
              Count cash in the drawer and enter the total to close shift #{shiftId}.
            </Text>
            <Text style={{ ...outfit('medium', 13), marginBottom: 6 }}>Closing cash count</Text>
            <TextInput style={inputStyle} keyboardType="decimal-pad" value={closingCount} onChangeText={setClosingCount} />
            <Text style={{ ...outfit('medium', 13), marginBottom: 6, marginTop: 12 }}>Notes (optional)</Text>
            <TextInput style={[inputStyle, { minHeight: 80 }]} multiline value={notes} onChangeText={setNotes} />
            <Pressable
              onPress={() => void onClose()}
              disabled={loading}
              style={{
                backgroundColor: colors.accentTeal,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ ...outfit('semibold', 15), color: '#fff' }}>{loading ? 'Closing…' : 'Close shift'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
