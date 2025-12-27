import { View } from 'react-native';

import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

export const RecipeDetailSkeleton = () => {
  return (
    <View className="pt-safe flex-1 bg-background">
      <View className="flex-1 gap-4 px-4">
        {/* Back button */}
        <SkeletonCircle size={40} />

        {/* Recipe title */}
        <View className="gap-2">
          <SkeletonText width="full" height="lg" />
          <SkeletonText width="lg" height="lg" />
        </View>

        {/* Image placeholder */}
        <Skeleton className="h-48 w-full rounded-xl" />

        {/* Ingredients section */}
        <View className="gap-3">
          <SkeletonText width="sm" height="md" />
          <View className="gap-2">
            <SkeletonText width="lg" height="sm" />
            <SkeletonText width="full" height="sm" />
            <SkeletonText width="md" height="sm" />
            <SkeletonText width="lg" height="sm" />
            <SkeletonText width="full" height="sm" />
          </View>
        </View>

        {/* Instructions section */}
        <View className="gap-3">
          <SkeletonText width="sm" height="md" />
          <View className="gap-2">
            <SkeletonText width="full" height="sm" />
            <SkeletonText width="full" height="sm" />
            <SkeletonText width="lg" height="sm" />
          </View>
        </View>
      </View>
    </View>
  );
};

