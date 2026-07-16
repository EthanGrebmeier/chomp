import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  CategoryColor,
  getCategorySurfaceClassName,
  getCategoryTextClassName,
} from '../features/shared/category/category-colors';
import { cn } from '../lib/utils';

import { Text } from './ui/text';

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
  },
});

type CategoryLabelProps = ComponentProps<typeof Text> & {
  color: CategoryColor;
  containerClassName?: string;
};

export const CategoryLabel = ({
  color,
  className,
  containerClassName,
  ...props
}: CategoryLabelProps) => {
  return (
    <View
      className={cn(
        'self-start rounded-lg px-1.5 py-0.5',
        getCategorySurfaceClassName(color),
        containerClassName
      )}
      style={styles.container}
    >
      <Text
        className={cn(getCategoryTextClassName(color), className)}
        {...props}
      />
    </View>
  );
};
