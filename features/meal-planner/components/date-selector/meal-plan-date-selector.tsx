import { isSameDay } from 'date-fns';
import { ScrollView } from 'react-native';
import { MealPlanDateSelectorDate } from './meal-plan-date-selector-date';

type MealPlanDateSelectorProps = {
  dates: Date[];
  currentDate: Date;
  onDatePress: (date: Date) => void;
};

const MealPlanDateSelector = ({
  dates,
  currentDate,
  onDatePress,
}: MealPlanDateSelectorProps) => {
  return (
    <ScrollView
      contentContainerClassName="flex-row items-center gap-4 px-2"
      className="flex-shrink-0 flex-grow-0"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {dates.map(date => (
        <MealPlanDateSelectorDate
          key={date.toISOString()}
          date={date}
          isSelected={isSameDay(date, currentDate)}
          onPress={onDatePress}
        />
      ))}
    </ScrollView>
  );
};

export default MealPlanDateSelector;
