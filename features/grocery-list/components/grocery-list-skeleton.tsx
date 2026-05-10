import { View } from 'react-native';

import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

import { GroceryItemSkeleton } from './grocery-item-skeleton';

export const GroceryListSkeleton = () => {
  return (
    <View className="flex-1">
      {/* Header */}
      <View className="gap-2 px-4">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-9 w-44 rounded-md" />
          <View className="flex-row items-center gap-4">
            <SkeletonCircle size={24} />
            <SkeletonCircle size={24} />
          </View>
        </View>
      </View>

      {/* First section header */}
      <View className="mt-1 bg-background px-4 pt-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-1">
            <SkeletonText width="sm" height="md" />
            <SkeletonText width="sm" height="xs" />
          </View>
          <View className="flex-row items-center gap-3">
            <Skeleton className="h-4 w-10 rounded-md" />
            <SkeletonCircle size={20} />
          </View>
        </View>
      </View>

      {/* List items */}
      <View>
        <GroceryItemSkeleton showBorder showNotes />
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder showTags={false} />
      </View>

      {/* Checked section */}
      <View className="bg-background px-4 pt-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 gap-1">
            <SkeletonText width="sm" height="md" />
            <SkeletonText width="sm" height="xs" />
          </View>
          <SkeletonCircle size={20} />
        </View>
      </View>

      <View>
        <GroceryItemSkeleton showBorder />
        <GroceryItemSkeleton showBorder={false} />
      </View>

      {/* Bottom actions */}
      <View className="bottom-safe pointer-events-none absolute left-6 z-10">
        <Skeleton className="h-10 w-40 rounded-full" />
      </View>
      <View className="bottom-safe pointer-events-none absolute right-6 z-10">
        <SkeletonCircle size={52} />
      </View>
    </View>
  );
};

