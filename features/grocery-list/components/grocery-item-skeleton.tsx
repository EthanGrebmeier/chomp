import { View } from 'react-native';

import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

type GroceryItemSkeletonProps = {
  showBorder?: boolean;
};

export const GroceryItemSkeleton = ({
  showBorder = true,
}: GroceryItemSkeletonProps) => {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-3 ${
        showBorder ? 'border-b border-dashed border-border' : ''
      }`}
    >
      {/* Checkbox */}
      <SkeletonCircle size={24} />

      {/* Content */}
      <View className="flex-1 gap-2">
        {/* Item name */}
        <SkeletonText width="lg" height="md" />

        {/* Metadata row (quantity, unit, category tag) */}
        <View className="flex-row items-center gap-2">
          <SkeletonText width="sm" height="xs" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </View>
      </View>
    </View>
  );
};

