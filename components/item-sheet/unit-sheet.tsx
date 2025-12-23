import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, ScaleIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { Button } from '../ui/button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';

const unitOptions = [
  { label: 'Each', value: 'each' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Gram', value: 'g' },
  { label: 'Liter', value: 'l' },
  { label: 'Milliliter', value: 'ml' },
  { label: 'Pound', value: 'lb' },
] as const;

type UnitOptionProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

const UnitOption = ({ label, isSelected, onPress }: UnitOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <View className="size-10 items-center justify-center rounded-full bg-muted">
        <Icon as={ScaleIcon} size={20} className="text-muted-foreground" />
      </View>
      <Text
        className={cn(
          'flex-1 text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  </HapticPressable>
);

type UnitSheetProps = {
  quantity: number;
  unit: string;
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: string) => void;
};

export const UnitSheet = ({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
}: UnitSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const quantityInputRef = useRef<TextInput>(null);
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());
  const [localUnit, setLocalUnit] = useState(unit);

  const selectedUnit = unitOptions.find(opt => opt.value === localUnit);

  const isValid = !!localQuantity.length && parseInt(localQuantity, 10) > 0;

  const formatDisplay = () => {
    if (unit === 'each') {
      return `x${quantity}`;
    }
    return `${quantity} ${unit}`;
  };

  const openSheet = () => {
    setLocalQuantity(quantity.toString());
    setLocalUnit(unit);
    sheetRef.current?.present();
  };

  const handleQuantityChange = (text: string) => {
    setLocalQuantity(text);
  };

  const handleUnitSelect = (value: string) => {
    setLocalUnit(value);
  };

  const handleConfirm = () => {
    const parsed = parseInt(localQuantity, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onQuantityChange(parsed);
    }
    onUnitChange(localUnit);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable onPress={openSheet} hapticType="light">
          <Pill
            textClassName="font-semibold"
            icon={
              <Icon
                className="text-muted-foreground"
                as={ScaleIcon}
                size={16}
              />
            }
            hasValue={true}
            className="min-w-16 justify-between"
          >
            {formatDisplay()}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet ref={sheetRef} name="unit-sheet">
        <BottomSheet.SheetView>
          <View className="flex-row items-center gap-2 pb-2">
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
            <BottomSheet.Header title="Quantity" />
            <Button
              onPress={handleConfirm}
              size="circle"
              className="ml-auto"
              disabled={!isValid}
            >
              <Icon
                as={CheckIcon}
                size={20}
                className="text-primary-foreground"
              />
            </Button>
          </View>

          <View className="mb-4 flex-row items-center gap-3 rounded-xl bg-muted px-4 py-3">
            <TextInput
              ref={quantityInputRef}
              value={localQuantity}
              onChangeText={handleQuantityChange}
              keyboardType="number-pad"
              className="flex-1 text-2xl font-bold text-foreground"
              placeholder="1"
              placeholderTextColor="#9ca3af"
              selectTextOnFocus
            />
            <Text className="text-lg text-muted-foreground">
              {selectedUnit?.label ?? 'Each'}
            </Text>
          </View>

          <Text className="mb-2 text-sm font-medium text-muted-foreground">
            Unit
          </Text>
          <ScrollView
            className="max-h-72"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {unitOptions.map(option => (
              <UnitOption
                key={option.value}
                label={option.label}
                isSelected={localUnit === option.value}
                onPress={() => handleUnitSelect(option.value)}
              />
            ))}
          </ScrollView>
        </BottomSheet.SheetView>
      </BottomSheet>
    </>
  );
};
