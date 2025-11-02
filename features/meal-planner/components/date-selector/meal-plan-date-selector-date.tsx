import { format } from 'date-fns';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

type MealPlanDateSelectorDateProps = {
  date: Date;
  isSelected: boolean;
  onPress: (date: Date) => void;
};

export const MealPlanDateSelectorDate = ({
  date,
  isSelected,
  onPress,
}: MealPlanDateSelectorDateProps) => {
  return (
    <Pressable onPress={() => onPress(date)} className="items-center">
      <View
        className={cn(
          'size-10 items-center justify-center rounded-full bg-gray-100'
        )}
      >
        <Text
          className={cn(
            'text-sm font-semibold',
            isSelected && 'text-accent-orange-foreground'
          )}
        >
          {format(date, 'EEEEEE')}
        </Text>
      </View>
      <Text
        className={cn(
          'text-sm font-semibold',
          isSelected && 'text-accent-orange-foreground'
        )}
      >
        {format(date, 'LL/d')}
      </Text>
    </Pressable>
  );
};
