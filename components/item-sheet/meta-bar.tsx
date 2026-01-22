import { MetaBarLayout } from '../meta-bar-layout';
import { ScrollingMetaBar } from '../scrolling-meta-bar';
import { Button } from '../ui/button';
import { Text } from '../ui/text';

import { CategorySheet } from './category-sheet';
import { StoreSheet } from './store-sheet';
import { UnitSheet } from './unit-sheet';
import { useItemSheet } from './use-item-sheet';

export const MetaBar = () => {
  const {
    category,
    setCategory,
    quantity,
    setQuantity,
    unit,
    setUnit,
    storeId,
    setStoreId,
    onSubmit,
    isValid,
    mode,
  } = useItemSheet();

  return (
    <MetaBarLayout
      action={
        <Button
          variant="default"
          size="default"
          onPress={onSubmit}
          disabled={!isValid}
        >
          <Text className="text-primary-foreground">
            {mode === 'add' ? 'Add Item' : 'Update Item'}
          </Text>
        </Button>
      }
    >
      <ScrollingMetaBar>
        <CategorySheet category={category} onSelect={setCategory} />
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
        />
        <StoreSheet storeId={storeId} onSelect={setStoreId} />
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};
