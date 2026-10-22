import { View } from 'react-native';

import { SkeletonText } from '@/components/ui/skeleton';

/** Mirrors RecipeCard inside ListItem: one itemTitle line (h-6) with py-1 + py-0.5 row padding. */
export const RecipeCardSkeleton = () => {
  return (
    <View className="w-full py-1.5">
      <SkeletonText width="lg" height="lg" />
    </View>
  );
};
