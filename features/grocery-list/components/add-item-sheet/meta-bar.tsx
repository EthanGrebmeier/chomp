import { View } from 'react-native';

import { CategorySheet } from './category-sheet';
import { UnitSheet } from './unit-sheet';
import { useAddItem } from './useAddItem';

export const MetaBar = () => {
  const { category, setCategory, quantity, setQuantity, unit, setUnit } =
    useAddItem();

  return (
    <View className="my-3 flex-row items-center gap-2">
      <CategorySheet category={category} onSelect={setCategory} />
      <UnitSheet
        quantity={quantity}
        unit={unit}
        onQuantityChange={setQuantity}
        onUnitChange={setUnit}
      />
    </View>
  );
};
