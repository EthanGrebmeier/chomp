import { CheckIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

import { CategorySheet } from './category-sheet';
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
    onSubmit,
    isValid,
  } = useItemSheet();

  return (
    <View className="mt-3 flex-row items-center justify-between gap-2">
      <View className="flex-row items-center gap-2">
        <CategorySheet category={category} onSelect={setCategory} />
        <UnitSheet
          quantity={quantity}
          unit={unit}
          onQuantityChange={setQuantity}
          onUnitChange={setUnit}
        />
      </View>
      <Button
        variant="default"
        size="icon"
        onPress={onSubmit}
        disabled={!isValid}
      >
        <Icon
          as={CheckIcon}
          size={18}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
    </View>
  );
};
