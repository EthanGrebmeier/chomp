import { View } from 'react-native';

import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

export const ListItemSkeleton = () => {
  return (
    <View className="flex-row items-center gap-3 px-4 py-4">
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
