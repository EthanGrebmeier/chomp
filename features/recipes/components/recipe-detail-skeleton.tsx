import { View } from 'react-native';

import {
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from '@/components/ui/skeleton';

import { RecipeIngredientSkeleton } from './recipe-ingredient-skeleton';

/** Mirrors RecipeDetail: fixed nav bar, then overview + ingredients in one scroll. */
export const RecipeDetailSkeleton = () => {
  return (
    <View className="flex-1 bg-background">
      <View className="h-11 flex-row items-center justify-between px-4">
        <SkeletonCircle size={32} />
        <SkeletonCircle size={32} />
      </View>

      <View className="flex-1 gap-6 pt-2">
        {/* Overview */}
        <View className="gap-3 px-4">
          <View className="items-start gap-2">
            <Skeleton className="h-9 w-4/5 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </View>
          <View className="gap-2">
            <SkeletonText width="full" height="md" />
            <SkeletonText width="lg" height="md" />
          </View>
        </View>

        {/* Ingredients */}
        <View className="gap-1">
          <View className="h-9 justify-center px-4">
            <SkeletonText width="sm" height="xs" />
          </View>
          <RecipeIngredientSkeleton showNotes />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton showTag={false} />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton />
        </View>
      </View>

      <View className="bottom-safe pointer-events-none absolute inset-x-4 z-10">
        <Skeleton className="h-10 w-full rounded-full" />
      </View>
    </View>
  );
};
