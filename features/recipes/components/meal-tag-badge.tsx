import { StyleSheet, View } from 'react-native';

import { Text } from '../../../components/ui/text';

const styles = StyleSheet.create({
  container: {
    borderCurve: 'continuous',
  },
});

type MealTagBadgeProps = {
  mealTag?: string | null;
};

/** Neutral badge for a recipe's meal (Breakfast, Dinner, ...). Renders nothing when unset. */
export const MealTagBadge = ({ mealTag }: MealTagBadgeProps) => {
  if (!mealTag) {
    return null;
  }

  return (
    <View
      className="rounded-lg bg-muted px-1.5 py-0.5"
      style={styles.container}
    >
      <Text variant="caption" className="font-medium" numberOfLines={1}>
        {mealTag}
      </Text>
    </View>
  );
};
