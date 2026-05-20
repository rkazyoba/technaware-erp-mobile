import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Linking, Modal, Pressable, View } from 'react-native';

import { Text } from './AppTypography';
import { colors } from '../constants/colors';
import type { IonGlyph } from '../constants/modulePresentation';
import { useStaffPortal } from '../context/StaffPortalContext';
import { canCrud, canCrudOrLegacy, LOGISTICS_LEGACY } from '../utils/crudPermissions';
import { isPortalModuleRouteAccessible } from '../utils/portalModuleAccess';
import { staffPortalHasPermission } from '../utils/staffPortalPermissions';
import { webErpPaths, webErpUrl } from '../utils/webErpUrls';

type QuickCreateSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type QuickCreateRow = {
  key: string;
  label: string;
  icon: IonGlyph;
  onPress: () => void;
};

export function QuickCreateSheet({ visible, onClose }: QuickCreateSheetProps) {
  const navigation = useNavigation();
  const { setPortalActiveTab, setPortalSelectedModule, portal } = useStaffPortal();

  const nav = navigation as { navigate: (name: string, params?: object) => void };

  const goModulesScreen = (screen: string, moduleRoute: string, params?: object) => {
    onClose();
    setPortalActiveTab('modules');
    setPortalSelectedModule(moduleRoute);
    nav.navigate('Modules', { screen, params });
  };

  const openWebCreate = (moduleRoute: string, webPath: string) => {
    onClose();
    setPortalActiveTab('modules');
    setPortalSelectedModule(moduleRoute);
    void Linking.openURL(webErpUrl(webPath));
  };

  const storeMovementSurface = isPortalModuleRouteAccessible(portal, 'Store movements');
  const canNativeStoreMovement =
    storeMovementSurface &&
    (staffPortalHasPermission(portal, 'erp.user.kitchen_to_store') ||
      staffPortalHasPermission(portal, 'erp.user.store_to_kitchen'));

  const canNativeDeliveryNote =
    isPortalModuleRouteAccessible(portal, 'Delivery notes') &&
    canCrudOrLegacy(portal, 'delivery_notes', 'create', LOGISTICS_LEGACY.delivery_notes);

  const canNativeGrnPo =
    isPortalModuleRouteAccessible(portal, 'GRN (PO)') &&
    canCrudOrLegacy(portal, 'po_receipts', 'create', LOGISTICS_LEGACY.po_receipts);

  const canNativeNonPoReceipt =
    isPortalModuleRouteAccessible(portal, 'Non-PO receipts') &&
    canCrudOrLegacy(portal, 'non_po_receipts', 'create', LOGISTICS_LEGACY.non_po_receipts);

  const canNativeSupplierReturn =
    isPortalModuleRouteAccessible(portal, 'Supplier returns') &&
    canCrudOrLegacy(portal, 'supplier_returns', 'create', LOGISTICS_LEGACY.supplier_returns);

  const canNativePickTicket =
    isPortalModuleRouteAccessible(portal, 'Pick tickets') && canCrud(portal, 'pick_tickets', 'create');

  const canLeave = isPortalModuleRouteAccessible(portal, 'Leave Requests');

  const rows: QuickCreateRow[] = [];

  if (canNativeGrnPo) {
    rows.push({
      key: 'grn_po',
      label: 'New PO receipt (GRN)',
      icon: 'clipboard-outline',
      onPress: () => goModulesScreen('PoGrnHeader', 'GRN (PO)'),
    });
  }

  if (canNativeNonPoReceipt) {
    rows.push({
      key: 'non_po',
      label: 'New non-PO receipt',
      icon: 'receipt-outline',
      onPress: () => goModulesScreen('NonPoGrnHeader', 'Non-PO receipts'),
    });
  }

  if (canNativeDeliveryNote) {
    rows.push({
      key: 'delivery_note',
      label: 'New delivery note',
      icon: 'car-outline',
      onPress: () => goModulesScreen('DeliveryNoteHeader', 'Delivery notes'),
    });
  }

  if (canNativeSupplierReturn) {
    rows.push({
      key: 'supplier_return',
      label: 'New supplier return',
      icon: 'arrow-undo-outline',
      onPress: () => goModulesScreen('SupplierReturnHeader', 'Supplier returns'),
    });
  }

  if (canNativePickTicket) {
    rows.push({
      key: 'pick_ticket',
      label: 'New pick ticket',
      icon: 'ticket-outline',
      onPress: () => goModulesScreen('PickTicketHeader', 'Pick tickets'),
    });
  }

  if (canNativeStoreMovement) {
    rows.push({
      key: 'store_movement',
      label: 'New store movement',
      icon: 'swap-horizontal-outline',
      onPress: () => goModulesScreen('StoreMovementHeader', 'Store movements'),
    });
  }

  if (canLeave) {
    rows.push({
      key: 'leave',
      label: 'New leave request',
      icon: 'calendar-outline',
      onPress: () => goModulesScreen('LeaveRequestForm', 'Leave Requests'),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            paddingBottom: 28,
            maxHeight: '80%',
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSubtle, alignSelf: 'center', marginBottom: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginBottom: 12 }}>Quick create</Text>

          {rows.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>
              No mobile quick-create actions are enabled for your role.
            </Text>
          ) : (
            rows.map((row) => (
              <Pressable key={row.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={row.onPress}>
                <Ionicons name={row.icon} size={20} color={colors.primaryNavy} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>{row.label}</Text>
              </Pressable>
            ))
          )}

          <Pressable onPress={onClose} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
