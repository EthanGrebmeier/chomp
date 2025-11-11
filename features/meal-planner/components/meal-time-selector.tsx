import { ClockIcon } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { MealTag } from '../types';

const mealTimes: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
];

type MealTimeSelectorProps = {
  mealTime?: MealTag;
  onSelect: (mealTime?: MealTag) => void;
};

export const MealTimeSelector = ({
  mealTime,
  onSelect,
}: MealTimeSelectorProps) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill hasValue={!!mealTime} icon={<Icon as={ClockIcon} size={16} />}>
          {mealTime
            ? mealTime.charAt(0).toUpperCase() + mealTime.slice(1)
            : 'Meal Time'}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {mealTimes.map(time => (
          <DropdownMenuCheckboxItem
            key={time}
            value={mealTime === time ? 'on' : 'off'}
            onValueChange={() => onSelect(time)}
          >
            <DropdownMenuItemTitle className="capitalize">
              {time}
            </DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
