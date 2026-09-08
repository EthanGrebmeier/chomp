import { View } from 'react-native';

import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

import { RecipeIngredientSkeleton } from './recipe-ingredient-skeleton';

export const RecipeDetailSkeleton = () => {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 gap-4">
        <View className="relative min-h-10 px-4">
          <View className="absolute left-4 top-0 z-10">
            <SkeletonCircle size={32} />
          </View>
          <View className="items-center px-14">
            <Skeleton className="h-8 w-3/5 rounded-md" />
          </View>
          <View className="absolute right-4 top-0">
            <SkeletonCircle size={32} />
          </View>
        </View>

        <View className="px-4">
          <SkeletonText width="sm" height="sm" />
        </View>

        <View className="gap-2 px-4">
          <SkeletonText width="full" height="md" />
          <SkeletonText width="lg" height="md" />
        </View>

        <View className="flex-1">
          <View className="px-4">
            <SkeletonText width="sm" height="xs" />
          </View>
          <RecipeIngredientSkeleton showNotes />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton showTag={false} />
          <RecipeIngredientSkeleton />
          <RecipeIngredientSkeleton showBorder={false} />
        </View>
      </View>

      <View className="bottom-safe pointer-events-none absolute left-6 z-10">
        <Skeleton className="h-10 w-24 rounded-full" />
      </View>
      <View className="bottom-safe pointer-events-none absolute right-6 z-10">
        <Skeleton className="h-10 w-24 rounded-full" />
      </View>
    </View>
  );
};
