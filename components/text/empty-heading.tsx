import { Text, TextProps } from 'react-native';

import { cn } from '../../lib/utils';

export const EmptyHeading = ({ className, ...props }: TextProps) => {
  return (
    <Text
      className={cn('text-center text-xl font-semibold text-foreground', className)}
      {...props}
    />
  );
};

