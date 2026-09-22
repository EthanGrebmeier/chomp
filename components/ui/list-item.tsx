import { View } from 'react-native';

import { cn } from '@/lib/utils';

import { SwipeToDelete } from './swipe-to-delete';

type ListItemProps = {
  className?: string;
  children?: React.ReactNode;
  onDelete?: () => void;
};

type SwipeableListItemProps = {
  className?: string;
  children?: React.ReactNode;
  onDelete: () => void;
};

const SwipeableListItem = ({
  className,
  children,
  onDelete,
}: SwipeableListItemProps) => {
  return (
    <SwipeToDelete onDelete={onDelete}>
      <View
        className={cn('flex-row items-center gap-2 px-4 py-1', className)}
      >
        {children}
      </View>
    </SwipeToDelete>
  );
};

const BasicListItem = ({
  className,
  children,
}: Pick<ListItemProps, 'className' | 'children'>) => {
  return (
    <View className="overflow-hidden">
      <View
        className={cn('z-10 flex-row items-center gap-2 px-4 py-1', className)}
      >
        {children}
      </View>
    </View>
  );
};

export const ListItem = ({ className, children, onDelete }: ListItemProps) => {
  if (!onDelete) {
    return <BasicListItem className={className}>{children}</BasicListItem>;
  }

  return (
    <SwipeableListItem className={className} onDelete={onDelete}>
      {children}
    </SwipeableListItem>
  );
};
