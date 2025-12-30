import { format, isToday } from 'date-fns';
import { Undo2 } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';

type MealPlanDateProps = {
  currentDate: Date;
  onTodayPress: () => void;
};

export const MealPlanDate = ({
  currentDate,
  onTodayPress,
}: MealPlanDateProps) => {
  const showTodayButton = !isToday(currentDate);
  const formattedDate = format(currentDate, 'MMM d, yyyy');

  return (
    <View className="min-h-10 flex-row items-center justify-between  px-4">
      <Animated.View
        key={currentDate.toISOString()}
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
      >
        <Text className="text-xl font-medium text-foreground">
          {formattedDate}
        </Text>
      </Animated.View>
      {showTodayButton && (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(140)}
        >
          <Button
            variant="outline"
            size="sm"
            onPress={onTodayPress}
            className="flex-row items-center gap-1.5"
          >
            <Icon as={Undo2} size={14} className="text-foreground" />
            <Text className="text-sm font-medium">Today</Text>
          </Button>
        </Animated.View>
      )}
    </View>
  );
};
