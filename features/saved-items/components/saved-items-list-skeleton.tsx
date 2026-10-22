import { View } from 'react-native';

import { ListItemSkeleton } from '@/features/shared/components/list-item-skeleton';

export const SavedItemsListSkeleton = () => {
  return (
    <View className="flex-1">
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </View>
  );
};
