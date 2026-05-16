import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { colors } from '../constants/colors';

type ProfileAvatarProps = {
  uri: string | null | undefined;
  size?: number;
  name?: string;
};

export function ProfileAvatar({ uri, size = 72, name }: ProfileAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(13,27,62,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: colors.borderSubtle,
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          accessibilityLabel={name ? `Profile photo for ${name}` : 'Profile photo'}
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.5)} color={colors.primaryNavy} />
      )}
    </View>
  );
}
