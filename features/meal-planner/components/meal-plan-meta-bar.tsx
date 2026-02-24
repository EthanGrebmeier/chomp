import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { StoreSheet } from '../../../components/item-sheet/store-sheet';
import { UnitSheet } from '../../../components/item-sheet/unit-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';

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
  submitLabel?: string;
  showAction?: boolean;
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
  submitLabel = 'Add Item',
  showAction = true,
}: MealPlanMetaBarProps) => {
  return (
    <MetaBarLayout
      action={
        showAction ? (
          <Button variant="default" onPress={onSubmit} disabled={!isValid}>
            <Text className="text-primary-foreground">{submitLabel}</Text>
          </Button>
        ) : undefined
      }
    >
      <ScrollingMetaBar>
        <DatePillSheet date={date} onSelect={onDateChange} />
        <MealTimeSheet mealTime={mealTag} onSelect={onMealTagChange} />
      </ScrollingMetaBar>
      <ScrollingMetaBar className="mt-2">
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={onQuantityChange}
          onUnitChange={onUnitChange}
        />
        <CategorySheet category={category} onSelect={onCategoryChange} />
        <StoreSheet storeId={storeId} onSelect={onStoreIdChange} />
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};
