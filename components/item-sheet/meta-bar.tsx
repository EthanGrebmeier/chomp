import { CheckIcon } from 'lucide-react-native';

import { ScrollingMetaBar } from '../scrolling-meta-bar';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

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
  } = useItemSheet();

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
      <CategorySheet category={category} onSelect={setCategory} />
      <UnitSheet
        quantity={quantity}
        unit={unit}
        onQuantityChange={setQuantity}
        onUnitChange={setUnit}
      />
      <StoreSheet storeId={storeId} onSelect={setStoreId} />
    </ScrollingMetaBar>
  );
};
