import { View } from 'react-native';

import { ListItemSkeleton } from '@/features/shared/components/list-item-skeleton';

export const SavedItemsListSkeleton = () => {
  return (
    <View className="flex-1">
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder />
      <ListItemSkeleton showBorder={false} />
    </View>
  );
};

