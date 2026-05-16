import { Pressable, View } from 'react-native';
import { Text, TextInput } from './AppTypography';
import { styles } from '../styles/appStyles';

type ModuleSearchToolbarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder: string;
};

export function ModuleSearchToolbar({
  value,
  onChangeText,
  onSearch,
  onClear,
  placeholder,
}: ModuleSearchToolbarProps) {
  return (
    <View style={styles.dimPanel}>
      <Text style={styles.panelTitle}>Search</Text>
      <View style={styles.toolbarRow}>
        <TextInput
          style={[styles.approvalNoteInput, styles.toolbarInput]}
          placeholder={placeholder}
          placeholderTextColor="#96a2b8"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <Pressable style={styles.compactSecondaryBtn} onPress={onClear}>
          <Text style={styles.compactSecondaryBtnText}>Clear</Text>
        </Pressable>
        <Pressable style={styles.compactPrimaryBtn} onPress={onSearch}>
          <Text style={styles.compactPrimaryBtnText}>Go</Text>
        </Pressable>
      </View>
    </View>
  );
}
