import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

/** A fixed suggestion region keeps the native auto detent stable while typing. */
export function ItemSuggestions({
  children,
  onClose,
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
}) {
  return (
    <View style={{ height: 208, flexShrink: 0 }}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={label}
        accessibilityRole="button"
      />
      <View className="absolute bottom-2 left-0 right-0">
        <ScrollView
          style={{ maxHeight: 200, flexGrow: 0 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}
