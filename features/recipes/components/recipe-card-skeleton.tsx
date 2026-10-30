import { View } from 'react-native';

import { SkeletonText } from '@/components/ui/skeleton';

/** Mirrors the recipe card's title, metadata, and meal badge. */
export const RecipeCardSkeleton = () => {
  return (
    <View className="w-full flex-row items-center gap-3 px-4 py-3.5">
      <View className="flex-1 gap-1">
        <SkeletonText width="lg" height="lg" />
        <SkeletonText width="md" height="md" />
      </View>
      <View className="h-6 w-14 rounded-lg bg-muted" />
    </View>
  );
};
