import type { TextProps } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from '../ui/text';

export const EmptySubtext = ({ className, ...props }: TextProps) => {
  return (
    <Text
      variant="bodyMuted"
      className={cn('text-center', className)}
      {...props}
    />
  );
};
