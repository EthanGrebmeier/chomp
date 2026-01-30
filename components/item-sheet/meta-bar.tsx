import { MetaBarLayout } from '../meta-bar-layout';
import { ScrollingMetaBar } from '../scrolling-meta-bar';

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
  } = useItemSheet();

  return (
    <MetaBarLayout>
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
