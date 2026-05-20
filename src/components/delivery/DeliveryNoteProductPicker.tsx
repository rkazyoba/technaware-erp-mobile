import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import { Text } from '../AppTypography';
import { getCategories, getProducts, type ProductListItem } from '../../api';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

type Props = {
  visible: boolean;
  token: string;
  saving: boolean;
  onClose: () => void;
  onSave: (product: ProductListItem, quantity: number) => void;
};

export function DeliveryNoteProductPicker({ visible, token, saving, onClose, onSave }: Props) {
  const [productQuery, setProductQuery] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productRows, setProductRows] = useState<ProductListItem[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [qtyInput, setQtyInput] = useState('1');

  const step = selectedProduct ? 2 : 1;
  const stepLabel = step === 1 ? 'Select product' : 'Enter quantity';

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSelectedProduct(null);
    setQtyInput('1');
    setProductQuery('');
    setProductRows([]);
    void getCategories(token, 1, 100, '')
      .then((res) => {
        const map: Record<string, string> = {};
        for (const row of res.data.items) {
          map[row.id] = row.name;
        }
        setCategoryNames(map);
      })
      .catch(() => setCategoryNames({}));
  }, [visible, token]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setProductLoading(true);
        try {
          const res = await getProducts(token, 1, 50, productQuery);
          const rows = res.data.items.filter((p) => (p.status ?? '').toLowerCase() === 'active');
          setProductRows(rows);
        } catch {
          setProductRows([]);
        } finally {
          setProductLoading(false);
        }
      })();
    }, 350);
    return () => clearTimeout(t);
  }, [visible, productQuery, token]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedProduct?.category_id) {
      return '';
    }
    return categoryNames[selectedProduct.category_id] ?? '';
  }, [categoryNames, selectedProduct]);

  const handleSave = () => {
    if (!selectedProduct) {
      return;
    }
    const qty = Number(qtyInput);
    if (Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Quantity', 'Enter a valid quantity greater than zero.');
      return;
    }
    onSave(selectedProduct, qty);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !saving && onClose()}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={() => !saving && onClose()}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
            maxHeight: '90%',
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSubtle, alignSelf: 'center', marginBottom: 14 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ ...outfit('medium', 17), color: colors.textPrimary }}>Add product line</Text>
            <Pressable onPress={() => !saving && onClose()} hitSlop={8} disabled={saving}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.primaryNavy,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Text style={{ ...outfit('medium', 12), color: '#fff' }}>{step}</Text>
            </View>
            <Text style={{ ...outfit('medium', 13), color: colors.textSecondary }}>{stepLabel}</Text>
            <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginLeft: 8 }}>· Step {step} of 2</Text>
          </View>

          {selectedProduct ? (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: colors.pageBg,
                borderWidth: 0.5,
                borderColor: colors.accentTeal,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text style={{ ...outfit('medium', 11), color: colors.accentTeal, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Selected product
              </Text>
              <Text style={{ ...outfit('medium', 15), color: colors.textPrimary, marginTop: 6 }}>
                {selectedProduct.code} · {selectedProduct.name}
              </Text>
              {selectedCategoryName ? (
                <Text style={{ ...outfit('regular', 12), color: colors.textMuted, marginTop: 4 }}>{selectedCategoryName}</Text>
              ) : null}
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  borderRadius: 12,
                  backgroundColor: colors.pageBg,
                  paddingHorizontal: 12,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={productQuery}
                  onChangeText={setProductQuery}
                  placeholder="Search by code or name"
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    ...outfit('regular', 15),
                    color: colors.textPrimary,
                  }}
                />
              </View>
              {productLoading ? <ActivityIndicator color={colors.accentTeal} style={{ marginVertical: 20 }} /> : null}
              <FlatList
                style={{ maxHeight: 400 }}
                data={productRows}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const cat = categoryNames[item.category_id] ?? '';
                  return (
                    <Pressable
                      onPress={() => {
                        setSelectedProduct(item);
                        setQtyInput('1');
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 4,
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.borderSubtle,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: colors.pageBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Ionicons name="cube-outline" size={20} color={colors.primaryNavy} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...outfit('medium', 14), color: colors.textPrimary }}>{item.code}</Text>
                        <Text style={{ ...outfit('regular', 13), color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {cat ? (
                          <Text style={{ ...outfit('regular', 11), color: colors.textMuted, marginTop: 4 }}>{cat}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  productLoading ? null : (
                    <Text style={{ ...outfit('regular', 14), color: colors.textSecondary, paddingVertical: 24, textAlign: 'center' }}>
                      No active products match your search.
                    </Text>
                  )
                }
              />
            </>
          ) : (
            <>
              <Text style={{ ...outfit('medium', 12), color: colors.textMuted, marginBottom: 6 }}>Quantity</Text>
              <TextInput
                value={qtyInput}
                onChangeText={setQtyInput}
                keyboardType="decimal-pad"
                style={{
                  borderWidth: 0.5,
                  borderColor: colors.borderSubtle,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  backgroundColor: colors.pageBg,
                  ...outfit('regular', 16),
                  color: colors.textPrimary,
                }}
              />
              <Pressable
                onPress={() => void handleSave()}
                disabled={saving}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: saving ? colors.borderSubtle : colors.accentTeal,
                  alignItems: 'center',
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ ...outfit('medium', 15), color: '#fff' }}>Save line</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setSelectedProduct(null)}
                disabled={saving}
                style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
              >
                <Text style={{ ...outfit('medium', 14), color: colors.linkBlue }}>Choose a different product</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
