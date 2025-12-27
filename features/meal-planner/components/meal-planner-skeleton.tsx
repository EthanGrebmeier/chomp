import { View } from 'react-native';

import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

import { MealCardSkeleton } from './meal-card-skeleton';

export const MealPlannerSkeleton = () => {
  return (
    <View className="flex-1 gap-4">
      {/* Header */}
      <View className="gap-2 px-4">
        <View className="flex-row items-center justify-between">
          <SkeletonText width="md" height="lg" />
          <View className="h-6 w-6" />
        </View>
        {/* Date range */}
        <SkeletonText width="lg" height="sm" />
      </View>

      {/* Date selector */}
      <View className="flex-row gap-2 px-4">
        <Skeleton className="h-16 w-14 rounded-lg" />
        <Skeleton className="h-16 w-14 rounded-lg" />
        <Skeleton className="h-16 w-14 rounded-lg" />
        <Skeleton className="h-16 w-14 rounded-lg" />
        <Skeleton className="h-16 w-14 rounded-lg" />
      </View>

      {/* Meal sections */}
      <View className="flex-1 gap-4 px-4">
        {/* Breakfast */}
        <View className="gap-2">
          <SkeletonText width="sm" height="md" />
          <MealCardSkeleton />
        </View>

        {/* Lunch */}
        <View className="gap-2">
          <SkeletonText width="sm" height="md" />
          <MealCardSkeleton />
          <MealCardSkeleton />
        </View>

        {/* Dinner */}
        <View className="gap-2">
          <SkeletonText width="sm" height="md" />
          <MealCardSkeleton />
        </View>
      </View>
    </View>
  );
};

