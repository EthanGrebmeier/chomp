import { PropsWithChildren } from 'react';
import { View } from 'react-native';

/** Fixed viewport: rows scroll inside while the rounded book surface stays put. */
export function RecipeBookSurface({ children }: PropsWithChildren) {
  return (
    <View className="mx-4 mb-3 mt-2 flex-1 overflow-hidden rounded-xl bg-recipe-surface">
      {children}
    </View>
  );
}

export function RecipeRowSeparator() {
  return <View className="mx-4 h-px bg-black/5 dark:bg-white/5" />;
}
