import { ArrowUpIcon } from 'lucide-react-native';

import { CategorySheet } from '../../../components/item-sheet/category-sheet';
import { StoreSheet } from '../../../components/item-sheet/store-sheet';
import { UnitSheet } from '../../../components/item-sheet/unit-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';

type MealPlanMetaBarProps = {
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
  optionsDisabled?: boolean;
};

export const MealPlanMetaBar = ({
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
  optionsDisabled = false,
}: MealPlanMetaBarProps) => {
  return (
    <MetaBarLayout
      action={
        showAction ? (
          <Button
            size="icon"
            className="size-10"
            hitSlop={2}
            accessibilityLabel={submitLabel}
            onPress={onSubmit}
            disabled={!isValid}
          >
            <Icon
              as={ArrowUpIcon}
              size={22}
              strokeWidth={2.5}
              className="text-primary-foreground"
            />
          </Button>
        ) : undefined
      }
    >
      <ScrollingMetaBar>
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={onQuantityChange}
          onUnitChange={onUnitChange}
          disabled={optionsDisabled}
        />
        <CategorySheet
          category={category}
          onSelect={onCategoryChange}
          disabled={optionsDisabled}
        />
        <StoreSheet
          storeId={storeId}
          onSelect={onStoreIdChange}
          disabled={optionsDisabled}
        />
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};
