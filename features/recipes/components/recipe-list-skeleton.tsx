import { View } from 'react-native';

import { RecipeCardSkeleton } from './recipe-card-skeleton';

export const RecipeListSkeleton = () => {
  return (
    <View className="flex-1">
      <View className="px-4">
        <RecipeCardSkeleton />
        <View className="border-b border-dashed border-border" />
        <RecipeCardSkeleton />
        <View className="border-b border-dashed border-border" />
        <RecipeCardSkeleton />
        <View className="border-b border-dashed border-border" />
        <RecipeCardSkeleton />
        <View className="border-b border-dashed border-border" />
        <RecipeCardSkeleton />
      </View>
    </View>
  );
};

