import { cva, type VariantProps } from 'class-variance-authority';
import {
  GestureResponderEvent,
  Platform,
  View,
  type PressableStateCallbackType,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HapticPressable } from '@/components/ui/haptic-pressable';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const AnimatedHapticPressable =
  Animated.createAnimatedComponent(HapticPressable);

const buttonVariants = cva(
  cn(
    'group relative shrink-0 items-center justify-center rounded-full shadow-none transition-opacity',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90 dark:bg-destructive/60 shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5 text-secondary-foreground',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        link: '',
      },
      size: {
        default: cn(
          'px-3 py-1 sm:h-9',
          Platform.select({ web: 'has-[>svg]:px-3' })
        ),
        sm: cn(
          'h-8 px-4 py-1 sm:h-9',
          Platform.select({ web: 'has-[>svg]:px-2.5' })
        ),
        lg: cn(
          'h-10 px-6 sm:h-10',
          Platform.select({ web: 'has-[>svg]:px-4' })
        ),
        xl: cn(
          'h-12 px-8 sm:h-12',
          Platform.select({ web: 'has-[>svg]:px-6' })
        ),
        'wide-small': cn('h-10 w-24'),
        icon: 'size-8',
        iconLg: 'size-14',
        circle: 'rounded-full p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-base font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground text-lg font-semibold uppercase',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({
            web: 'underline-offset-4 hover:underline group-hover:underline',
          })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        xl: '',
        'wide-small': '',
        icon: '',
        iconLg: '',
        circle: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ButtonIconPosition = 'left' | 'right';

const floatingIconOffsets: Record<
  ButtonSize,
  Record<ButtonIconPosition, string>
> = {
  default: {
    left: 'left-3',
    right: 'right-3',
  },
  sm: {
    left: 'left-2.5',
    right: 'right-2.5',
  },
  lg: {
    left: 'left-3.5',
    right: 'right-3.5',
  },
  xl: {
    left: 'left-4',
    right: 'right-4',
  },
  'wide-small': {
    left: 'left-3',
    right: 'right-3',
  },
  icon: {
    left: 'left-2',
    right: 'right-2',
  },
  iconLg: {
    left: 'left-4',
    right: 'right-4',
  },
  circle: {
    left: 'left-2',
    right: 'right-2',
  },
};

type ButtonProps = React.ComponentProps<typeof HapticPressable> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Optional icon anchored to the left or right edge
     * while keeping the main button content centered.
     */
    icon?: React.ReactNode;
    /**
     * Which side to anchor the icon to.
     * @default 'left'
     */
    iconPosition?: ButtonIconPosition;
    /**
     * Whether to trigger haptic feedback on press
     * @default true
     */
    haptic?: boolean;
    /**
     * The type of haptic feedback to trigger
     * @default 'light'
     */
    hapticType?:
      | 'light'
      | 'medium'
      | 'heavy'
      | 'selection'
      | 'impact'
      | 'notification';
  };

function Button({
  className,
  variant,
  size,
  children,
  icon,
  iconPosition = 'left',
  haptic = true,
  hapticType = 'light',
  onPressIn,
  onPressOut,
  style,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const resolvedSize = size ?? 'default';
  const hasFloatingIcon = Boolean(icon);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    scale.value = withSpring(0.97, {
      damping: 80,
      stiffness: 600,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 600,
    });
    onPressOut?.(event);
  };

  const renderButtonContents = (content: React.ReactNode) => (
    <>
      {hasFloatingIcon ? (
        <View
          pointerEvents="none"
          className={cn(
            'absolute inset-y-0 justify-center',
            floatingIconOffsets[resolvedSize][iconPosition]
          )}
        >
          {icon}
        </View>
      ) : null}

      <View className="flex-row items-center justify-center gap-2">
        {content}
      </View>
    </>
  );

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <AnimatedHapticPressable
        className={cn(
          props.disabled && 'opacity-50',
          buttonVariants({ variant, size }),
          className
        )}
        role="button"
        haptic={haptic}
        hapticType={hapticType}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
        {...props}
      >
        {typeof children === 'function'
          ? (state: PressableStateCallbackType) =>
              renderButtonContents(children(state))
          : renderButtonContents(children)}
      </AnimatedHapticPressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
