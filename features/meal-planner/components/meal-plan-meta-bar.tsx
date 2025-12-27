import { CheckIcon } from 'lucide-react-native';

import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { StoreSheet } from '../../../components/item-sheet/store-sheet';
import { UnitSheet } from '../../../components/item-sheet/unit-sheet';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';

import { DatePillSheet } from './date-pill-sheet';
import { MealTimeSheet } from './meal-time-sheet';

type MealPlanMetaBarProps = {
  date?: string;
  onDateChange: (date: string) => void;
  mealTag?: string;
  onMealTagChange: (mealTag?: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  category?: string;
  onCategoryChange: (category?: string) => void;
  storeId?: string;
  onStoreIdChange: (storeId?: string) => void;
  onSubmit: () => void;
  isValid: boolean;
};

export const MealPlanMetaBar = ({
  date,
  onDateChange,
  mealTag,
  onMealTagChange,
  quantity,
  onQuantityChange,
  unit,
  onUnitChange,
  category,
  onCategoryChange,
  storeId,
  onStoreIdChange,
  onSubmit,
  isValid,
}: MealPlanMetaBarProps) => {
  return (
    <ScrollingMetaBar
      action={
        <Button
          variant="default"
          size="icon"
          className="size-10"
          onPress={onSubmit}
          disabled={!isValid}
        >
          <Icon
            as={CheckIcon}
            size={24}
            strokeWidth={3}
            className="text-primary-foreground"
          />
        </Button>
      }
    >
      <DatePillSheet date={date} onSelect={onDateChange} />
      <MealTimeSheet mealTime={mealTag} onSelect={onMealTagChange} />
      <UnitSheet
        quantity={quantity}
        unit={unit}
        onQuantityChange={onQuantityChange}
        onUnitChange={onUnitChange}
      />
      <CategorySheet category={category} onSelect={onCategoryChange} />
      <StoreSheet storeId={storeId} onSelect={onStoreIdChange} />
    </ScrollingMetaBar>
  );
};
