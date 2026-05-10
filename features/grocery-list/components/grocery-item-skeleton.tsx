import { View } from 'react-native';

import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

type GroceryItemSkeletonProps = {
  showBorder?: boolean;
  showNotes?: boolean;
  showTags?: boolean;
};

export const GroceryItemSkeleton = ({
  showBorder = true,
  showNotes = false,
  showTags = true,
}: GroceryItemSkeletonProps) => {
  return (
    <View
      className={`flex-row items-start gap-3 px-4 py-2 ${
        showBorder ? 'border-b border-dashed border-border' : ''
      }`}
    >
      {/* Checkbox */}
      <SkeletonCircle size={24} className="mt-1" />

      {/* Content */}
      <View className="flex-1 gap-2 py-1">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2 pr-2">
            <SkeletonText width="md" height="md" className="h-6" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </View>

          <Skeleton className="h-6 w-16 rounded-full" />
        </View>

        {showNotes ? <SkeletonText width="lg" height="sm" /> : null}

        {showTags ? (
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </View>
        ) : null}
      </View>
    </View>
  );
};

