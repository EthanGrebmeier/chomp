import { View } from 'react-native';

import {
  SurfaceContent,
  type SurfaceSpacing,
} from '@/components/surface-content';
import { SkeletonCircle, SkeletonText } from '@/components/ui/skeleton';

export const ListItemSkeleton = ({
  spacing = 'standard',
}: {
  spacing?: SurfaceSpacing;
}) => {
  return (
    <SurfaceContent
      spacing={spacing}
      className="flex-row items-center gap-3 py-4"
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
    </SurfaceContent>
  );
};
