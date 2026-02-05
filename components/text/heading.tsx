import { VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Text } from '../ui/text';

type HeadingProps = VariantProps<typeof headingVariants> & {
  children: React.ReactNode;
  className?: string;
};

const headingVariants = cva('text-2xl font-bold text-foreground', {
  variants: {
    size: {
      default: 'text-2xl',
      lg: 'text-3xl',
      sm: 'text-xl',
    },
  },
});

export const Heading = ({ children, className, size }: HeadingProps) => {
  return (
    <Text className={cn(headingVariants({ size }), className)}>{children}</Text>
  );
};
