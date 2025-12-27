import { View } from 'react-native';

import { SkeletonText } from '@/components/ui/skeleton';

import { GroceryItemSkeleton } from './grocery-item-skeleton';

export const GroceryListSkeleton = () => {
  return (
    <View className="flex-1 gap-2">
      {/* Header */}
      <View className="gap-2 px-4">
        <View className="flex-row items-center justify-between">
          {/* Title */}
          <SkeletonText width="md" height="lg" />
          {/* Menu icon placeholder */}
          <View className="h-6 w-6" />
        </View>
        {/* Subtitle */}
        <SkeletonText width="sm" height="xs" />
      </View>

      {/* Filter pills */}
      <View className="flex-row gap-2 px-4 pb-2">
        <View className="h-8 w-24 rounded-full bg-muted" />
        <View className="h-8 w-24 rounded-full bg-muted" />
      </View>

      {/* Section header */}
      <View className="px-4 py-2">
        <SkeletonText width="sm" height="md" />
      </View>

      {/* List items */}
      <View>
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder={false} />
      </View>
    </View>
  );
};

