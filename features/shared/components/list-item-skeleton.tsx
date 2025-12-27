import { View } from 'react-native';

import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

type ListItemSkeletonProps = {
  showBorder?: boolean;
};

export const ListItemSkeleton = ({
  showBorder = true,
}: ListItemSkeletonProps) => {
  return (
    <View
      className={`flex-row items-center gap-3 px-4 py-4 ${
        showBorder ? 'border-b border-dashed border-border' : ''
      }`}
    >
      {/* Icon or avatar placeholder */}
      <SkeletonCircle size={20} />

      {/* Content */}
      <View className="flex-1 gap-1">
        {/* Name */}
        <SkeletonText width="lg" height="md" />
        {/* Metadata or subtitle */}
        <SkeletonText width="sm" height="xs" />
      </View>
    </View>
  );
};

