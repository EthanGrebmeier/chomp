import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, ScaleIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { Button } from '../ui/button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';

import { EditUnitSheet, EditUnitSheetRef } from './edit-unit-sheet';
import { formatQuantityUnit, normalizeUnit } from './unit-utils';
import {
  CUSTOM_UNIT_VALUE,
  DEFAULT_UNIT_VALUE,
  UNIT_OPTIONS,
} from './units';

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
  const editSheetRef = useRef<EditUnitSheetRef>(null);
  const quantityInputRef = useRef<TextInput>(null);
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());
  const [localUnit, setLocalUnit] = useState(normalizeUnit(unit));

  const normalizedLocalUnit = normalizeUnit(localUnit);
  const isCatalogUnit = UNIT_OPTIONS.some(
    option =>
      option.value !== CUSTOM_UNIT_VALUE && option.value === normalizedLocalUnit
  );
  const displayUnitLabel =
    UNIT_OPTIONS.find(option => option.value === normalizedLocalUnit)?.label ??
    normalizedLocalUnit;

  const isValid = !!localQuantity.length && parseInt(localQuantity, 10) > 0;

  const formatDisplay = () => formatQuantityUnit(quantity, unit);

  const openSheet = () => {
    setLocalQuantity(quantity.toString());
    setLocalUnit(normalizeUnit(unit));
    sheetRef.current?.present();
  };

  const handleQuantityChange = (text: string) => {
    setLocalQuantity(text);
  };

  const handleUnitSelect = (value: string) => {
    if (value === CUSTOM_UNIT_VALUE) {
      editSheetRef.current?.present(normalizedLocalUnit);
      return;
    }
    setLocalUnit(value);
  };

  const handleConfirm = () => {
    const parsed = parseInt(localQuantity, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onQuantityChange(parsed);
    }
    onUnitChange(normalizedLocalUnit);
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
        <BottomSheet.Header
          className="px-4"
          title="Quantity"
          dismissButton={
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
          }
          button={
            <Button onPress={handleConfirm} size="icon" disabled={!isValid}>
              <Icon
                as={CheckIcon}
                size={20}
                className="text-primary-foreground"
              />
            </Button>
          }
        />

        <View className="px-4">
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
              {displayUnitLabel || DEFAULT_UNIT_VALUE}
            </Text>
          </View>

          <Text className="mb-2 text-sm font-medium text-muted-foreground">
            Unit
          </Text>
          <View className="gap-2">
            {UNIT_OPTIONS.map(option => (
              <UnitOption
                key={option.value}
                label={option.label}
                isSelected={
                  option.value === CUSTOM_UNIT_VALUE
                    ? !isCatalogUnit
                    : normalizedLocalUnit === option.value
                }
                onPress={() => handleUnitSelect(option.value)}
              />
            ))}
          </View>
        </View>
      </BottomSheet>

      <EditUnitSheet
        ref={editSheetRef}
        onSave={value => {
          setLocalUnit(normalizeUnit(value));
        }}
      />
    </>
  );
};
