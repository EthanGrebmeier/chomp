import { VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Text } from '../ui/text';

type HeadingProps = VariantProps<typeof headingVariants> & {
  children: React.ReactNode;
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

export const Heading = ({ children, className, size }: HeadingProps) => {
  return (
    <Text variant="h1" className={cn(headingVariants({ size }), className)}>
      {children}
    </Text>
  );
};
