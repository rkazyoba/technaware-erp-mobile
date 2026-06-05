export const OFFLINE_WRITE_MESSAGE = 'Connect to the internet to save changes.';

export function canPerformWrite(
  isOffline: boolean,
  onBlocked?: (message: string) => void,
): boolean {
  if (isOffline) {
    onBlocked?.(OFFLINE_WRITE_MESSAGE);
    return false;
  }
  return true;
}

export const OFFLINE_REFRESH_MESSAGE = 'No connection. Pull to refresh when you are back online.';
