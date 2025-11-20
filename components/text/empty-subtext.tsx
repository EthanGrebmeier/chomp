import { Text, TextProps } from 'react-native';

import { cn } from '../../lib/utils';

export const EmptySubtext = ({ className, ...props }: TextProps) => {
  return (
    <Text
      className={cn('text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  );
};

