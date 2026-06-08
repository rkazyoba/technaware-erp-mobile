import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';
import { ErpTabBar } from '../components/ErpTabBar';
import { OfflineBanner } from '../components/OfflineBanner';
import { QuickCreateSheet } from '../components/QuickCreateSheet';
import { StaffPortalProvider, type PortalToastType } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from './moduleStackTypes';
import { ApprovalsScreen } from '../screens/ApprovalsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ModuleListScreen } from '../screens/ModuleListScreen';
import { ModuleWorkspaceScreen } from '../screens/ModuleWorkspaceScreen';
import { ModulesScreen } from '../screens/ModulesScreen';
import { PayslipScreen } from '../screens/PayslipScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecordDetailScreen } from '../screens/RecordDetailScreen';
import { HospitalityDetailScreen } from '../screens/HospitalityDetailScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { StoreMovementHeaderScreen } from '../screens/StoreMovementHeaderScreen';
import { StoreMovementLinesScreen } from '../screens/StoreMovementLinesScreen';
import { DeliveryNoteHeaderScreen } from '../screens/DeliveryNoteHeaderScreen';
import { DeliveryNoteLinesScreen } from '../screens/DeliveryNoteLinesScreen';
import { LeaveRequestFormScreen } from '../screens/LeaveRequestFormScreen';
import { RequisitionHeaderScreen } from '../screens/RequisitionHeaderScreen';
import { RequisitionWorkspaceScreen } from '../screens/RequisitionWorkspaceScreen';
import { PettyCashRequestFormScreen } from '../screens/PettyCashRequestFormScreen';
import { PaymentVoucherFormScreen } from '../screens/PaymentVoucherFormScreen';
import { CustomerPaymentRecordScreen } from '../screens/CustomerPaymentRecordScreen';
import { PettyCashRetirementScreen } from '../screens/PettyCashRetirementScreen';
import { StaffFinanceRetirementWorkspaceScreen } from '../screens/StaffFinanceRetirementWorkspaceScreen';
import { StaffFinanceRequestWorkspaceScreen } from '../screens/StaffFinanceRequestWorkspaceScreen';
import { PoGrnHeaderScreen } from '../screens/PoGrnHeaderScreen';
import { PoReceiptWorkspaceScreen } from '../screens/PoReceiptWorkspaceScreen';
import { NonPoGrnHeaderScreen } from '../screens/NonPoGrnHeaderScreen';
import { NonPoReceiptWorkspaceScreen } from '../screens/NonPoReceiptWorkspaceScreen';
import { SupplierReturnHeaderScreen } from '../screens/SupplierReturnHeaderScreen';
import { SupplierReturnWorkspaceScreen } from '../screens/SupplierReturnWorkspaceScreen';
import { PickTicketHeaderScreen } from '../screens/PickTicketHeaderScreen';
import { PickTicketWorkspaceScreen } from '../screens/PickTicketWorkspaceScreen';
import { MasterCatalogEditScreen } from '../screens/MasterCatalogEditScreen';
import { PartCatalogEditScreen } from '../screens/PartCatalogEditScreen';
import { PartExpirationFormScreen } from '../screens/PartExpirationFormScreen';
import { PartsMgmtEditScreen } from '../screens/PartsMgmtEditScreen';
import { PosOrdersScreen } from '../screens/pos/PosOrdersScreen';
import { PosRegisterScreen } from '../screens/pos/PosRegisterScreen';
import { PosHeldScreen } from '../screens/pos/PosHeldScreen';
import { PosReceiptScreen } from '../screens/pos/PosReceiptScreen';
import { PosReturnScreen } from '../screens/pos/PosReturnScreen';
import { PosZReportScreen } from '../screens/pos/PosZReportScreen';
import { PosShiftScreen } from '../screens/pos/PosShiftScreen';
import type { MobilePortalBootstrap, RefreshProfileOptions, SignedInUser } from '../types/app';

export type { ModulesStackParamList } from './moduleStackTypes';

const Tab = createBottomTabNavigator();
const ModulesStack = createNativeStackNavigator<ModulesStackParamList>();

function ModulesNavigator() {
  return (
    <ModulesStack.Navigator screenOptions={{ headerShown: false }}>
      <ModulesStack.Screen name="ModulesHome" component={ModulesScreen} />
      <ModulesStack.Screen name="ModuleList" component={ModuleListScreen} />
      <ModulesStack.Screen name="ModuleWorkspace" component={ModuleWorkspaceScreen} />
      <ModulesStack.Screen name="Profile" component={ProfileScreen} />
      <ModulesStack.Screen name="About" component={AboutScreen} />
      <ModulesStack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <ModulesStack.Screen name="HospitalityDetail" component={HospitalityDetailScreen} />
      <ModulesStack.Screen name="StoreMovementHeader" component={StoreMovementHeaderScreen} />
      <ModulesStack.Screen name="StoreMovementLines" component={StoreMovementLinesScreen} />
      <ModulesStack.Screen name="DeliveryNoteHeader" component={DeliveryNoteHeaderScreen} />
      <ModulesStack.Screen name="DeliveryNoteLines" component={DeliveryNoteLinesScreen} />
      <ModulesStack.Screen name="LeaveRequestForm" component={LeaveRequestFormScreen} />
      <ModulesStack.Screen name="RequisitionHeader" component={RequisitionHeaderScreen} />
      <ModulesStack.Screen name="RequisitionWorkspace" component={RequisitionWorkspaceScreen} />
      <ModulesStack.Screen name="PettyCashRequestForm" component={PettyCashRequestFormScreen} />
      <ModulesStack.Screen name="PaymentVoucherForm" component={PaymentVoucherFormScreen} />
      <ModulesStack.Screen name="CustomerPaymentRecord" component={CustomerPaymentRecordScreen} />
      <ModulesStack.Screen name="PettyCashRetirement" component={PettyCashRetirementScreen} />
      <ModulesStack.Screen name="StaffFinanceRetirementWorkspace" component={StaffFinanceRetirementWorkspaceScreen} />
      <ModulesStack.Screen name="StaffFinanceRequestWorkspace" component={StaffFinanceRequestWorkspaceScreen} />
      <ModulesStack.Screen name="PoGrnHeader" component={PoGrnHeaderScreen} />
      <ModulesStack.Screen name="PoReceiptWorkspace" component={PoReceiptWorkspaceScreen} />
      <ModulesStack.Screen name="NonPoGrnHeader" component={NonPoGrnHeaderScreen} />
      <ModulesStack.Screen name="NonPoReceiptWorkspace" component={NonPoReceiptWorkspaceScreen} />
      <ModulesStack.Screen name="SupplierReturnHeader" component={SupplierReturnHeaderScreen} />
      <ModulesStack.Screen name="SupplierReturnWorkspace" component={SupplierReturnWorkspaceScreen} />
      <ModulesStack.Screen name="PickTicketHeader" component={PickTicketHeaderScreen} />
      <ModulesStack.Screen name="PickTicketWorkspace" component={PickTicketWorkspaceScreen} />
      <ModulesStack.Screen name="MasterCatalogEdit" component={MasterCatalogEditScreen} />
      <ModulesStack.Screen name="PartCatalogEdit" component={PartCatalogEditScreen} />
      <ModulesStack.Screen name="PartsMgmtEdit" component={PartsMgmtEditScreen} />
      <ModulesStack.Screen name="PartExpirationForm" component={PartExpirationFormScreen} />
      <ModulesStack.Screen name="PosRegister" component={PosRegisterScreen} />
      <ModulesStack.Screen name="PosHeld" component={PosHeldScreen} />
      <ModulesStack.Screen name="PosReceipt" component={PosReceiptScreen} />
      <ModulesStack.Screen name="PosReturn" component={PosReturnScreen} />
      <ModulesStack.Screen name="PosZReport" component={PosZReportScreen} />
      <ModulesStack.Screen name="PosShift" component={PosShiftScreen} />
      <ModulesStack.Screen name="PosOrders" component={PosOrdersScreen} />
      <ModulesStack.Screen name="Approvals" component={ApprovalsScreen} />
    </ModulesStack.Navigator>
  );
}

function SignedInTabs() {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <ErpTabBar {...props} onFabPress={() => setFabOpen(true)} />}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Modules" component={ModulesNavigator} />
          <Tab.Screen name="Payslip" component={PayslipScreen} />
          <Tab.Screen name="Reports" component={ReportsScreen} />
        </Tab.Navigator>
      </View>
      <QuickCreateSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

type AppNavigatorProps = {
  token: string;
  user: SignedInUser | null;
  portal: MobilePortalBootstrap | null;
  loading: boolean;
  onRefreshProfile: (options?: RefreshProfileOptions) => void | Promise<void>;
  onApplyPortalBootstrap: (portal: MobilePortalBootstrap) => void;
  onLogout: () => void;
  onPortalNotify?: (message: string, type?: PortalToastType) => void;
};

export function AppNavigator({
  token,
  user,
  portal,
  loading,
  onRefreshProfile,
  onApplyPortalBootstrap,
  onLogout,
  onPortalNotify,
}: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <StaffPortalProvider
        key={token}
        token={token}
        user={user}
        portal={portal}
        loading={loading}
        onRefreshProfile={onRefreshProfile}
        onApplyPortalBootstrap={onApplyPortalBootstrap}
        onLogout={onLogout}
        onPortalNotify={onPortalNotify}
      >
        <SignedInTabs />
      </StaffPortalProvider>
    </NavigationContainer>
  );
}
