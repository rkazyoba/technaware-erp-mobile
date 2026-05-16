import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './AppTypography';
import { styles } from '../styles/appStyles';

export type StoreStripItem = { id: string; name: string; site: string };

type StoreStripProps = {
  stores: StoreStripItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function StoreStrip({ stores, selectedId, onSelect }: StoreStripProps) {
  if (stores.length === 0) {
    return null;
  }

  return (
    <View style={styles.dimPanel}>
      <Text style={styles.panelTitle}>Warehouse</Text>
      <Text style={styles.syncText}>Swipe sideways if you have many stores.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storeStripScroll}>
        <View style={styles.storeStripContent}>
          {stores.map((s) => {
            const active = selectedId === s.id;
            return (
              <Pressable
                key={s.id}
                style={[styles.storeStripChip, active ? styles.storeStripChipSelected : null]}
                onPress={() => onSelect(s.id)}
              >
                <Text style={styles.storeStripChipTitle} numberOfLines={2}>
                  {s.name}
                </Text>
                {s.site ? (
                  <Text style={styles.storeStripChipSub} numberOfLines={1}>
                    {s.site}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
