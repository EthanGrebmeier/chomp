import { isSameDay } from 'date-fns';
import { useRef } from 'react';
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
  const itemWidth = 40;
  const scrollViewRef = useRef<ScrollView>(null);
  const onSelectDate = (date: Date) => {
    const index = dates.indexOf(date);
    if (index < 4) {
      scrollViewRef.current?.scrollTo({
        x: 0,
        animated: true,
      });
    } else if (index > dates.length - 4) {
      scrollViewRef.current?.scrollTo({
        x: (dates.length - 4) * (itemWidth + 16),
        animated: true,
      });
    } else {
      scrollViewRef.current?.scrollTo({
        x: (index - 3) * (itemWidth + 16),
        animated: true,
      });
    }
    onDatePress(date);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerClassName="flex-row items-center gap-3 px-4 py-4"
      className="flex-shrink-0 flex-grow-0"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {dates.map(date => (
        <MealPlanDateSelectorDate
          key={date.toISOString()}
          date={date}
          isSelected={isSameDay(date, currentDate)}
          onPress={onSelectDate}
        />
      ))}
    </ScrollView>
  );
};

export default MealPlanDateSelector;
