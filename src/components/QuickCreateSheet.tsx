import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

import { Modal, Pressable, View } from 'react-native';

import { Text } from './AppTypography';

import { colors } from '../constants/colors';

import { useStaffPortal } from '../context/StaffPortalContext';

import { isPortalModuleRouteAccessible } from '../utils/portalModuleAccess';

import { staffPortalHasPermission } from '../utils/staffPortalPermissions';



type QuickCreateSheetProps = {

  visible: boolean;

  onClose: () => void;

};



export function QuickCreateSheet({ visible, onClose }: QuickCreateSheetProps) {

  const navigation = useNavigation();

  const { setPortalActiveTab, setPortalSelectedModule, portal } = useStaffPortal();



  const storeMovementSurface = isPortalModuleRouteAccessible(portal, 'Store movements');

  const canNativeStoreMovement =

    storeMovementSurface &&

    (staffPortalHasPermission(portal, 'erp.user.kitchen_to_store') ||

      staffPortalHasPermission(portal, 'erp.user.store_to_kitchen'));



  const deliveryNotesSurface = isPortalModuleRouteAccessible(portal, 'Delivery notes');

  const canNativeDeliveryNote =

    deliveryNotesSurface && staffPortalHasPermission(portal, 'erp.user.delivery_notes');



  const canLeave = isPortalModuleRouteAccessible(portal, 'Leave Requests');



  const goStoreMovement = () => {

    onClose();

    setPortalActiveTab('modules');

    setPortalSelectedModule('Store movements');

    (navigation as { navigate: (name: string, params?: object) => void }).navigate('Modules', {

      screen: 'StoreMovementHeader',

      params: {},

    });

  };



  const goDeliveryNote = () => {
    onClose();
    setPortalActiveTab('modules');
    setPortalSelectedModule('Delivery notes');
    (navigation as { navigate: (name: string, params?: object) => void }).navigate('Modules', {
      screen: 'DeliveryNoteHeader',
      params: {},
    });
  };

  const goLeave = () => {
    onClose();
    setPortalActiveTab('modules');
    setPortalSelectedModule('Leave Requests');
    (navigation as { navigate: (name: string, params?: object) => void }).navigate('Modules', {
      screen: 'LeaveRequestForm',
    });
  };



  const anyOption = canNativeStoreMovement || canNativeDeliveryNote || canLeave;



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

          }}

        >

          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderSubtle, alignSelf: 'center', marginBottom: 16 }} />

          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginBottom: 12 }}>Quick create</Text>



          {canNativeStoreMovement ? (

            <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={goStoreMovement}>

              <Ionicons name="swap-horizontal-outline" size={20} color={colors.primaryNavy} style={{ marginRight: 10 }} />

              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>New store movement</Text>

            </Pressable>

          ) : null}



          {canNativeDeliveryNote ? (
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={goDeliveryNote}>
              <Ionicons name="car-outline" size={20} color={colors.primaryNavy} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>New delivery note</Text>
            </Pressable>
          ) : null}

          {canLeave ? (

            <Pressable style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={goLeave}>

              <Ionicons name="calendar-outline" size={20} color={colors.primaryNavy} style={{ marginRight: 10 }} />

              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>New leave request</Text>

            </Pressable>

          ) : null}



          {!anyOption ? (

            <Text style={{ fontSize: 13, color: colors.textSecondary, paddingVertical: 8 }}>

              No mobile quick-create actions are enabled for your role.

            </Text>

          ) : null}



          <Pressable onPress={onClose} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>

            <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Cancel</Text>

          </Pressable>

        </Pressable>

      </Pressable>

    </Modal>

  );

}

