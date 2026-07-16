import type { TextProps } from 'react-native';

import { cn } from '../../lib/utils';
import { Text } from '../ui/text';

export const EmptyHeading = ({ className, ...props }: TextProps) => {
  return (
    <Text variant="h4" className={cn('text-center', className)} {...props} />
  );
};
