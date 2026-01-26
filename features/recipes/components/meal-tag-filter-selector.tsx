import {
  CakeSliceIcon,
  ClockIcon,
  CoffeeIcon,
  CookingPotIcon,
  CroissantIcon,
  SandwichIcon,
} from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';

type MealTagFilterSelectorProps = {
  mealTag?: string;
  onSelect: (mealTag?: string) => void;
};

const mealTagOptions = [
  { value: 'Breakfast', label: 'Breakfast', icon: CroissantIcon },
  { value: 'Lunch', label: 'Lunch', icon: SandwichIcon },
  { value: 'Dinner', label: 'Dinner', icon: CookingPotIcon },
  { value: 'Snack', label: 'Snack', icon: CoffeeIcon },
  { value: 'Dessert', label: 'Dessert', icon: CakeSliceIcon },
];

export const MealTagFilterSelector = ({
  mealTag,
  onSelect,
}: MealTagFilterSelectorProps) => {
  const selectedMealTag = mealTagOptions.find(
    option => option.value === mealTag
  );

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          hasValue={!!selectedMealTag}
          closeIconClassName="text-muted-foreground"
          icon={
            <Icon
              as={selectedMealTag?.icon ?? ClockIcon}
              className="text-muted-foreground"
              size={16}
            />
          }
          textClassName="text-muted-foreground"
        >
          {selectedMealTag ? selectedMealTag.label : 'All Meals'}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="all"
          value={!mealTag ? 'on' : 'off'}
          onValueChange={() => onSelect(undefined)}
        >
          <DropdownMenuItemTitle>All</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        {mealTagOptions.map(option => (
          <DropdownMenuCheckboxItem
            key={option.value}
            value={mealTag === option.value ? 'on' : 'off'}
            onValueChange={() => onSelect(option.value)}
          >
            <DropdownMenuItemTitle>{option.label}</DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
