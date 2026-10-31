import { MoreHorizontal, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

import { Button, buttonVariants, type ButtonProps } from './button';
import { Icon } from './icon';

type HeaderActionAppearance = {
  icon: LucideIcon;
  iconClassName?: string;
  iconSize?: number;
  iconAlignment?: 'center' | 'leading';
  /** Empty space before the visible SVG stroke, in points. */
  iconLeadingInset?: number;
};
export type HeaderActionButtonProps = Omit<
  ButtonProps,
  'size' | 'children' | 'icon'
> &
  HeaderActionAppearance;

/** Compact 36-point visual with a non-overlapping 44-point touch target. */
export function HeaderActionButton({
  icon,
  iconClassName,
  iconSize = 16,
  iconAlignment = 'center',
  iconLeadingInset = 0,
  variant = 'secondary',
  ...props
}: HeaderActionButtonProps) {
  return (
    <View
      className="size-11 items-center justify-center"
      style={
        iconAlignment === 'leading'
          ? { marginLeft: -(44 - iconSize) / 2 - iconLeadingInset }
          : undefined
      }
    >
      <Button {...props} variant={variant} size="icon" hitSlop={4}>
        <Icon
          as={icon}
          size={iconSize}
          strokeWidth={3}
          className={cn(
            variant === 'default' || variant === 'destructive'
              ? 'text-primary-foreground'
              : 'text-foreground',
            iconClassName
          )}
        />
      </Button>
    </View>
  );
}

/** Native dropdowns own the press handler; their trigger must not nest a button. */
export function HeaderMenuTrigger({
  accessibilityLabel,
  icon = MoreHorizontal,
  variant = 'ghost',
  size = 'regular',
}: {
  accessibilityLabel: string;
  icon?: LucideIcon;
  variant?: ButtonProps['variant'];
  size?: 'compact' | 'regular';
}) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="size-11 items-center justify-center"
    >
      <View className={buttonVariants({ variant, size: 'icon' })}>
        <Icon
          as={icon}
          size={size === 'regular' ? 24 : 16}
          strokeWidth={size === 'regular' ? 2 : 3}
          className={
            variant === 'default'
              ? 'text-primary-foreground'
              : 'text-foreground'
          }
        />
      </View>
    </View>
  );
}
