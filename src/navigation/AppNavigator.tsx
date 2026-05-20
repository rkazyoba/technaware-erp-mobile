import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useState } from 'react';
import { ErpTabBar } from '../components/ErpTabBar';
import { QuickCreateSheet } from '../components/QuickCreateSheet';
import { StaffPortalProvider, type PortalToastType } from '../context/StaffPortalContext';
import type { ModulesStackParamList } from './moduleStackTypes';
import { ApprovalsScreen } from '../screens/ApprovalsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ModuleListScreen } from '../screens/ModuleListScreen';
import { ModuleWorkspaceScreen } from '../screens/ModuleWorkspaceScreen';
import { ModulesScreen } from '../screens/ModulesScreen';
import { PayslipScreen } from '../screens/PayslipScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecordDetailScreen } from '../screens/RecordDetailScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { StoreMovementHeaderScreen } from '../screens/StoreMovementHeaderScreen';
import { StoreMovementLinesScreen } from '../screens/StoreMovementLinesScreen';
import { DeliveryNoteHeaderScreen } from '../screens/DeliveryNoteHeaderScreen';
import { DeliveryNoteLinesScreen } from '../screens/DeliveryNoteLinesScreen';
import { LeaveRequestFormScreen } from '../screens/LeaveRequestFormScreen';
import { PoGrnHeaderScreen } from '../screens/PoGrnHeaderScreen';
import { PoReceiptWorkspaceScreen } from '../screens/PoReceiptWorkspaceScreen';
import { NonPoGrnHeaderScreen } from '../screens/NonPoGrnHeaderScreen';
import { NonPoReceiptWorkspaceScreen } from '../screens/NonPoReceiptWorkspaceScreen';
import { SupplierReturnHeaderScreen } from '../screens/SupplierReturnHeaderScreen';
import { SupplierReturnWorkspaceScreen } from '../screens/SupplierReturnWorkspaceScreen';
import { PickTicketHeaderScreen } from '../screens/PickTicketHeaderScreen';
import { PickTicketWorkspaceScreen } from '../screens/PickTicketWorkspaceScreen';
import { MasterCatalogEditScreen } from '../screens/MasterCatalogEditScreen';
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
      <ModulesStack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <ModulesStack.Screen name="StoreMovementHeader" component={StoreMovementHeaderScreen} />
      <ModulesStack.Screen name="StoreMovementLines" component={StoreMovementLinesScreen} />
      <ModulesStack.Screen name="DeliveryNoteHeader" component={DeliveryNoteHeaderScreen} />
      <ModulesStack.Screen name="DeliveryNoteLines" component={DeliveryNoteLinesScreen} />
      <ModulesStack.Screen name="LeaveRequestForm" component={LeaveRequestFormScreen} />
      <ModulesStack.Screen name="PoGrnHeader" component={PoGrnHeaderScreen} />
      <ModulesStack.Screen name="PoReceiptWorkspace" component={PoReceiptWorkspaceScreen} />
      <ModulesStack.Screen name="NonPoGrnHeader" component={NonPoGrnHeaderScreen} />
      <ModulesStack.Screen name="NonPoReceiptWorkspace" component={NonPoReceiptWorkspaceScreen} />
      <ModulesStack.Screen name="SupplierReturnHeader" component={SupplierReturnHeaderScreen} />
      <ModulesStack.Screen name="SupplierReturnWorkspace" component={SupplierReturnWorkspaceScreen} />
      <ModulesStack.Screen name="PickTicketHeader" component={PickTicketHeaderScreen} />
      <ModulesStack.Screen name="PickTicketWorkspace" component={PickTicketWorkspaceScreen} />
      <ModulesStack.Screen name="MasterCatalogEdit" component={MasterCatalogEditScreen} />
      <ModulesStack.Screen name="Approvals" component={ApprovalsScreen} />
    </ModulesStack.Navigator>
  );
}

function SignedInTabs() {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <ErpTabBar {...props} onFabPress={() => setFabOpen(true)} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Modules" component={ModulesNavigator} />
        <Tab.Screen name="Payslip" component={PayslipScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
      <QuickCreateSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </>
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
