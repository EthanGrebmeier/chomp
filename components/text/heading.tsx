import { VariantProps, cva } from 'class-variance-authority';
import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { Text } from '../ui/text';

type HeadingProps = Omit<ComponentProps<typeof Text>, 'className' | 'variant'> &
  VariantProps<typeof headingVariants> & {
    className?: string;
  };

const headingVariants = cva(
  'text-2xl font-bold leading-8 tracking-tight text-foreground',
  {
    variants: {
      size: {
        default: '',
        lg: 'text-3xl leading-9',
        sm: 'text-xl leading-7',
      },
    },
  }
);

export const Heading = ({
  children,
  className,
  size,
  ...props
}: HeadingProps) => {
  return (
    <Text
      variant="h1"
      className={cn(headingVariants({ size }), className)}
      {...props}
    >
      {children}
    </Text>
  );
};
