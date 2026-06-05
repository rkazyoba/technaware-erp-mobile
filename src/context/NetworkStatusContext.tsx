import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type NetworkStatusContextValue = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  /** True when the device has no connection or internet is explicitly unreachable. */
  isOffline: boolean;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

function deriveOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return true;
  }
  if (state.isInternetReachable === false) {
    return true;
  }
  return false;
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [netState, setNetState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setNetState);
    void NetInfo.fetch().then(setNetState);
    return unsubscribe;
  }, []);

  const value = useMemo<NetworkStatusContextValue>(() => {
    const isConnected = netState?.isConnected ?? true;
    const isInternetReachable = netState?.isInternetReachable ?? null;
    return {
      isConnected,
      isInternetReachable,
      isOffline: netState ? deriveOffline(netState) : false,
    };
  }, [netState]);

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatus(): NetworkStatusContextValue {
  const value = useContext(NetworkStatusContext);
  if (!value) {
    throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  }
  return value;
}
