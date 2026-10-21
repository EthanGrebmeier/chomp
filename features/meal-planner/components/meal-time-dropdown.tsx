import {
  CakeSliceIcon,
  ClockIcon,
  CoffeeIcon,
  CookingPotIcon,
  CroissantIcon,
  LucideIcon,
  SandwichIcon,
} from 'lucide-react-native';
import { ReactNode } from 'react';

import { OptionDropdown } from '../../../components/item-sheet/option-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';

type MealTimeOptionType = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const mealTimeOptions: MealTimeOptionType[] = [
  { value: 'Breakfast', label: 'Breakfast', icon: CroissantIcon },
  { value: 'Lunch', label: 'Lunch', icon: SandwichIcon },
  { value: 'Dinner', label: 'Dinner', icon: CookingPotIcon },
  { value: 'Snack', label: 'Snack', icon: CoffeeIcon },
  { value: 'Dessert', label: 'Dessert', icon: CakeSliceIcon },
];

type MealTimeDropdownProps = {
  mealTime?: string;
  onSelect: (mealTime?: string) => void;
  disabled?: boolean;
  children?: ReactNode;
};

export const MealTimeDropdown = ({
  mealTime,
  onSelect,
  disabled = false,
  children,
}: MealTimeDropdownProps) => {
  const selectedMealTime = mealTimeOptions.find(
    option => option.value === mealTime
  );

  return (
    <OptionDropdown
      label="meal time"
      triggerClassName={children ? 'min-h-8' : undefined}
      value={mealTime}
      options={
        mealTime && !selectedMealTime
          ? [{ value: mealTime, label: mealTime }, ...mealTimeOptions]
          : mealTimeOptions
      }
      disabled={disabled}
      onSelect={onSelect}
    >
      {children ?? (
        <Pill
          className={cn(disabled && 'opacity-50')}
          textClassName={cn(disabled && 'text-muted-foreground')}
          icon={
            <Icon
              className="text-muted-foreground"
              as={selectedMealTime?.icon ?? ClockIcon}
              size={16}
            />
          }
          hasValue={!!mealTime}
        >
          {mealTime ?? 'Meal Time'}
        </Pill>
      )}
    </OptionDropdown>
  );
};
