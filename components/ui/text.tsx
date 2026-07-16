import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import {
  Platform,
  Text as RNText,
  type Role,
  type TextStyle,
} from 'react-native';

import { cn } from '@/lib/utils';

const textVariants = cva(
  cn(
    'text-foreground text-base',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-4xl font-bold leading-[1.1] tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'text-3xl font-bold leading-[1.15] tracking-tight',
          Platform.select({
            web: 'scroll-m-20 text-balance first:mt-0',
          })
        ),
        h3: cn(
          'text-2xl font-semibold leading-8 tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h4: cn(
          'text-xl font-semibold leading-7 tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        p: 'leading-6',
        body: '',
        bodyMuted: 'text-muted-foreground',
        blockquote: 'border-l-2 pl-3 leading-6 italic sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'text-muted-foreground text-lg',
        large: 'text-lg font-semibold',
        small: 'text-sm',
        muted: 'text-muted-foreground text-sm',
        label: 'text-sm font-medium',
        caption: 'text-muted-foreground text-sm',
        overline:
          'text-muted-foreground text-xs font-semibold uppercase leading-4 tracking-wider',
        itemTitle: 'text-xl leading-6 tracking-tight',
        itemMeta: 'text-muted-foreground text-base leading-6',
        itemDescription: 'text-muted-foreground text-base leading-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TABULAR_NUMBERS_STYLE: TextStyle = {
  fontVariant: ['tabular-nums'],
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  tabularNumbers = false,
  style,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
    tabularNumbers?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      style={[tabularNumbers ? TABULAR_NUMBERS_STYLE : undefined, style]}
      {...props}
    />
  );
}

export { Text, TextClassContext };
