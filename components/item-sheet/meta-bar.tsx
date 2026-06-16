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
    hasItemTitle,
    unit,
    setUnit,
    storeId,
    setStoreId,
    storeName,
    setStoreName,
  } = useItemSheet();
  const optionsDisabled = !hasItemTitle;

  return (
    <MetaBarLayout>
      <ScrollingMetaBar>
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
          disabled={optionsDisabled}
        />
        <CategorySheet
          category={category}
          onSelect={setCategory}
          disabled={optionsDisabled}
        />
        <StoreSheet
          storeId={storeId}
          storeName={storeName}
          disabled={optionsDisabled}
          onSelect={(nextStoreId, nextStoreName) => {
            setStoreId(nextStoreId);
            setStoreName(nextStoreName);
          }}
        />
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};
