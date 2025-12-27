import { View } from 'react-native';

import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

export const MealCardSkeleton = () => {
  return (
    <View className="rounded-lg border border-border bg-card p-4">
      {/* Recipe title */}
      <SkeletonText width="lg" height="md" />
      
      {/* Ingredient count or metadata */}
      <SkeletonText width="sm" height="xs" className="mt-2" />
    </View>
  );
};

