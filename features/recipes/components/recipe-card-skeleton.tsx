import { View } from 'react-native';

import { SkeletonText } from '@/components/ui/skeleton';

export const RecipeCardSkeleton = () => {
  return (
    <View className="w-full gap-1 py-4">
      {/* Recipe title */}
      <SkeletonText width="lg" height="lg" />
      <SkeletonText width="md" height="lg" className="mt-1" />
      
      {/* Ingredient count */}
      <SkeletonText width="sm" height="xs" className="mt-1" />
    </View>
  );
};

