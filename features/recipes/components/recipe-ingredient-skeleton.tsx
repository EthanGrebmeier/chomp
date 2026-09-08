import { View } from 'react-native';

import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

type RecipeIngredientSkeletonProps = {
  showBorder?: boolean;
  showNotes?: boolean;
  showTag?: boolean;
};

export const RecipeIngredientSkeleton = ({
  showBorder = true,
  showNotes = false,
  showTag = true,
}: RecipeIngredientSkeletonProps) => {
  return (
    <View
      className={`px-4 py-2 ${
        showBorder ? 'border-b border-dashed border-border' : ''
      }`}
    >
      <View className="gap-1 py-1">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2 pr-2">
            <SkeletonText width="md" height="md" className="h-6" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </View>
          {showTag ? <Skeleton className="h-5 w-16 rounded-lg" /> : null}
        </View>
        {showNotes ? <SkeletonText width="lg" height="sm" /> : null}
      </View>
    </View>
  );
};
