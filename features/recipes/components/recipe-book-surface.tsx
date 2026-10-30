import { PropsWithChildren } from 'react';
import { View } from 'react-native';

/** Shared full-width layout for the recipe book and its loading/empty states. */
export function RecipeBookSurface({ children }: PropsWithChildren) {
  return <View className="mt-2 flex-1">{children}</View>;
}

export function RecipeRowSeparator() {
  return <View className="mx-4 h-px bg-black/5 dark:bg-white/5" />;
}
