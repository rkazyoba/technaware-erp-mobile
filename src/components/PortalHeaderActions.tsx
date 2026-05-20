import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useStaffPortal } from '../context/StaffPortalContext';
import { colors } from '../constants/colors';
import { navigateToProfile } from '../navigation/navigateToProfile';
import { resolveProfilePhotoUrl } from '../utils/profileDisplay';

type PortalHeaderActionsProps = {
  showNotifications?: boolean;
  showProfile?: boolean;
};

function HeaderIconButton({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

export function PortalHeaderActions({ showNotifications = true, showProfile = true }: PortalHeaderActionsProps) {
  const navigation = useNavigation<any>();
  const {
    notificationsShortcutVisible,
    notificationUnreadCount,
    setPortalActiveTab,
    onOpenAction,
    user,
  } = useStaffPortal();

  const photoUri = resolveProfilePhotoUrl(user);

  const openNotifications = () => {
    setPortalActiveTab('modules');
    onOpenAction('Notifications');
    navigation.navigate('Modules', { screen: 'ModuleList', params: { moduleRoute: 'Notifications' } });
  };

  const openProfile = () => {
    setPortalActiveTab('modules');
    navigateToProfile(navigation);
  };

  if (!showProfile && !(showNotifications && notificationsShortcutVisible)) {
    return null;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {showNotifications && notificationsShortcutVisible ? (
        <HeaderIconButton onPress={openNotifications} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {notificationUnreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.accentTeal,
                borderWidth: 1.5,
                borderColor: colors.primaryNavy,
              }}
            />
          ) : null}
        </HeaderIconButton>
      ) : null}
      {showProfile ? (
        <HeaderIconButton onPress={openProfile} accessibilityLabel="Profile">
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: 28, height: 28, borderRadius: 14 }} />
          ) : (
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
          )}
        </HeaderIconButton>
      ) : null}
    </View>
  );
}
