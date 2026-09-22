import { MetaBarLayout } from '../meta-bar-layout';
import { ScrollingMetaBar } from '../scrolling-meta-bar';

import { CategorySheet } from './category-sheet';
import { DeleteSavedItemButton } from './delete-saved-item-button';
import { SaveItemToggle } from './save-item-toggle';
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
    mode,
    saveItem,
    setSaveItem,
    selectedItem,
  } = useItemSheet();
  const optionsDisabled = !hasItemTitle;
  // Both cloud matches and local matches can be synced or deleted in place.
  const hasEditableSavedItem =
    (selectedItem?.source === 'cloud' && !!selectedItem.cloudSavedItemId) ||
    (selectedItem?.source === 'local' && !!selectedItem.localSavedItemId);

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
        {mode === 'add' ? (
          <>
            <SaveItemToggle
              value={saveItem}
              onToggle={setSaveItem}
              disabled={optionsDisabled}
              isSync={hasEditableSavedItem}
            />
            {hasEditableSavedItem ? (
              <DeleteSavedItemButton disabled={optionsDisabled} />
            ) : null}
          </>
        ) : null}
      </ScrollingMetaBar>
    </MetaBarLayout>
  );
};
