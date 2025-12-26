import { CheckIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

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
    <View className="-ml-4 flex-row items-center justify-between">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="min-h-10 flex-1"
        contentContainerClassName="flex-row items-center justify-center gap-2 pl-4 pr-2"
      >
        <CategorySheet category={category} onSelect={setCategory} />
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
        />
        <StoreSheet storeId={storeId} onSelect={setStoreId} />
      </ScrollView>
      <View className="border-l border-border pl-2">
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
      </View>
    </View>
  );
};
