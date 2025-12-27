import { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/utils';

type SkeletonProps = ViewProps & {
  className?: string;
};

/**
 * Base skeleton component with pulse animation
 */
export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      {...props}
      className={cn('bg-muted rounded-md', className)}
    />
  );
};

type SkeletonTextProps = {
  className?: string;
  width?: 'full' | 'lg' | 'md' | 'sm';
  height?: 'xs' | 'sm' | 'md' | 'lg';
};

/**
 * Skeleton for text lines with configurable width
 */
export const SkeletonText = ({
  className,
  width = 'full',
  height = 'sm',
}: SkeletonTextProps) => {
  const widthClasses = {
    full: 'w-full',
    lg: 'w-4/5',
    md: 'w-3/5',
    sm: 'w-2/5',
  };

  const heightClasses = {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  return (
    <Skeleton
      className={cn(widthClasses[width], heightClasses[height], className)}
    />
  );
};

type SkeletonCircleProps = {
  className?: string;
  size?: number;
};

/**
 * Skeleton for circular elements like avatars or icons
 */
export const SkeletonCircle = ({
  className,
  size = 40,
}: SkeletonCircleProps) => {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width: size, height: size }}
    />
  );
};

type SkeletonCardProps = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Skeleton for card-like content blocks
 */
export const SkeletonCard = ({ className, children }: SkeletonCardProps) => {
  if (children) {
    return (
      <View className={cn('rounded-lg bg-muted/30 p-4', className)}>
        {children}
      </View>
    );
  }

  return <Skeleton className={cn('h-24 rounded-lg', className)} />;
};

