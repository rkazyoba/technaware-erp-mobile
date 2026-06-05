import { createContext, useContext, type ReactNode, useCallback, useEffect, useState } from 'react';
import { useNetworkStatus } from './NetworkStatusContext';
import { useStaffPortalModel, type StaffPortalModel, type StaffPortalModelInput } from '../hooks/useStaffPortalModel';
import { AppTab, MobilePortalBootstrap, RefreshProfileOptions, SignedInUser } from '../types/app';

export type PortalToastType = 'info' | 'success' | 'error';

export type StaffPortalContextValue = StaffPortalModel & {
  setPortalSelectedModule: (m: string) => void;
  setPortalActiveTab: (t: AppTab) => void;
  applyPortalBootstrap: (portal: MobilePortalBootstrap) => void;
  onPortalNotify?: (message: string, type?: PortalToastType) => void;
  isOffline: boolean;
  isConnected: boolean;
};

const StaffPortalContext = createContext<StaffPortalContextValue | null>(null);

export function useStaffPortal(): StaffPortalContextValue {
  const v = useContext(StaffPortalContext);
  if (!v) {
    throw new Error('useStaffPortal must be used within StaffPortalProvider');
  }
  return v;
}

type StaffPortalProviderProps = {
  children: ReactNode;
  token: string;
  user: SignedInUser | null;
  portal: MobilePortalBootstrap | null;
  loading: boolean;
  onRefreshProfile: (options?: RefreshProfileOptions) => void | Promise<void>;
  onApplyPortalBootstrap: (portal: MobilePortalBootstrap) => void;
  onLogout: () => void;
  onPortalNotify?: (message: string, type?: PortalToastType) => void;
};

export function StaffPortalProvider({
  children,
  token,
  user,
  portal,
  loading,
  onRefreshProfile,
  onApplyPortalBootstrap,
  onLogout,
  onPortalNotify,
}: StaffPortalProviderProps) {
  const { isOffline, isConnected } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedModule, setSelectedModule] = useState('Approvals');

  const onOpenAction = useCallback((target: string) => {
    const legacy: Record<string, string> = {
      'Add Leave Request': 'Leave Requests',
      'Download Last Payslip': 'payslip',
      'My Payslips': 'payslip',
      'Download Payslip': 'payslip',
      payroll: 'payslip',
      payslip: 'payslip',
    };
    const resolved = legacy[target] ?? target;
    if (resolved === 'payslip') {
      setActiveTab('payslip');
      return;
    }
    setSelectedModule(resolved);
    setActiveTab('modules');
  }, []);

  useEffect(() => {
    if (!portal?.surfaces?.length) {
      return;
    }
    const routes = portal.surfaces.filter((s) => s.visible && s.route).map((s) => s.route as string);
    if (routes.length === 0) {
      return;
    }
    setSelectedModule((current) => (routes.includes(current) ? current : routes[0]!));
  }, [portal]);

  const modelInput: StaffPortalModelInput = {
    token,
    user,
    portal,
    activeTab,
    selectedModule,
    loading,
    isOffline,
    onSetTab: setActiveTab,
    onRefreshProfile,
    onLogout,
    onOpenAction,
    onPortalNotify,
  };

  const model = useStaffPortalModel(modelInput);

  const value: StaffPortalContextValue = {
    ...model,
    setPortalSelectedModule: setSelectedModule,
    setPortalActiveTab: setActiveTab,
    applyPortalBootstrap: onApplyPortalBootstrap,
    onPortalNotify,
    isOffline,
    isConnected,
  };

  return <StaffPortalContext.Provider value={value}>{children}</StaffPortalContext.Provider>;
}
