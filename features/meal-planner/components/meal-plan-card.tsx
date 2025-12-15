import { format } from 'date-fns';
import { Pressable } from 'react-native';

import { cn } from '@/lib/utils';

import { Text } from '../../../components/ui/text';
import { MealPlan } from '../types';

type MealPlanCardProps = {
  mealPlan: MealPlan;
  onPress: () => void;
  className?: string;
};

export const MealPlanCard = ({
  mealPlan,
  onPress,
  className,
}: MealPlanCardProps) => {
  return (
    <Pressable onPress={onPress} className={cn('flex-1 ', className)}>
      <Text className="text-2xl font-semibold text-foreground">
        {mealPlan.name}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {format(new Date(mealPlan.startDate), 'MMM d')} -{' '}
        {format(new Date(mealPlan.endDate), 'MMM d, yyyy')}
      </Text>
    </Pressable>
  );
};
