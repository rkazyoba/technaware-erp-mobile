import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../AppTypography';
import { colors } from '../../constants/colors';
import { outfit } from '../../constants/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
};

export function PosBarcodeScannerModal({ visible, onClose, onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const lastCodeRef = useRef<string>('');

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      const code = String(data ?? '').trim();
      if (!code || locked || code === lastCodeRef.current) return;
      lastCodeRef.current = code;
      setLocked(true);
      onScan(code);
      onClose();
      setTimeout(() => {
        setLocked(false);
        lastCodeRef.current = '';
      }, 1200);
    },
    [locked, onClose, onScan],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={{ ...outfit('semibold', 16), color: '#fff' }}>Scan barcode</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        {!permission ? (
          <View style={styles.centered}>
            <Text style={{ color: '#fff' }}>Checking camera permission…</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centered}>
            <Text style={{ ...outfit('regular', 14), color: '#fff', textAlign: 'center', marginBottom: 16 }}>
              Camera access is required to scan product barcodes.
            </Text>
            <Pressable style={styles.permissionBtn} onPress={() => void requestPermission()}>
              <Text style={{ ...outfit('semibold', 14), color: colors.primaryNavy }}>Allow camera</Text>
            </Pressable>
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
            onBarcodeScanned={handleScan}
          />
        )}

        <View style={styles.footer}>
          <Text style={{ ...outfit('regular', 12), color: '#cbd5e1', textAlign: 'center' }}>
            Align the barcode inside the frame. You can also type codes in the register field.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryNavy,
  },
  camera: { flex: 1 },
  footer: { padding: 16, backgroundColor: '#111' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
