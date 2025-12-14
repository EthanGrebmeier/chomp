import { View } from 'react-native';

import { Button } from '../ui/button';
import { Text } from '../ui/text';

import { CategorySheet } from './category-sheet';
import { UnitSheet } from './unit-sheet';
import { useItemSheet } from './use-item-sheet';

type MetaBarProps = {
  submitLabel: string;
};

export const MetaBar = ({ submitLabel }: MetaBarProps) => {
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
      <Button variant="default" onPress={onSubmit} disabled={!isValid}>
        <Text>{submitLabel}</Text>
      </Button>
    </View>
  );
};
