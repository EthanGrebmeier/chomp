import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { ChevronDownIcon, ScaleIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { parseQuantity } from '@/features/quantity/model';

import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuSeparator,
} from '../native-dropdown';
import { BackButton } from '../ui/back-button';
import { ConfirmButton } from '../ui/confirm-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';
import { useUncontrolledTextInput } from '../use-uncontrolled-text-input';

import { EditUnitSheet, EditUnitSheetRef } from './edit-unit-sheet';
import { formatQuantityUnit, normalizeUnit } from './unit-utils';
import { CUSTOM_UNIT_VALUE, DEFAULT_UNIT_VALUE, UNIT_OPTIONS } from './units';

type UnitSheetProps = {
  quantity: number;
  unit: string;
  onQuantityChange: (quantity: number) => void;
  onUnitChange: (unit: string) => void;
  disabled?: boolean;
};

export const UnitSheet = ({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  disabled = false,
}: UnitSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const editSheetRef = useRef<EditUnitSheetRef>(null);
  const quantityInputRef = useRef<TextInput>(null);
  const quantityInput = useUncontrolledTextInput(quantity.toString());
  const [quantityIsValid, setQuantityIsValid] = useState(quantity > 0);
  const [localUnit, setLocalUnit] = useState(normalizeUnit(unit));

  const normalizedLocalUnit = normalizeUnit(localUnit);
  const isCatalogUnit = UNIT_OPTIONS.some(
    option =>
      option.value !== CUSTOM_UNIT_VALUE && option.value === normalizedLocalUnit
  );
  const displayUnitLabel =
    UNIT_OPTIONS.find(option => option.value === normalizedLocalUnit)?.label ??
    normalizedLocalUnit;

  const isValid = quantityIsValid;

  const displayQuantity = formatQuantityUnit(quantity, unit);

  const openSheet = () => {
    if (disabled) return;
    const nextQuantity = quantity.toString();
    quantityInput.reset(nextQuantity);
    setQuantityIsValid((parseQuantity(nextQuantity) ?? 0) > 0);
    setLocalUnit(normalizeUnit(unit));
    sheetRef.current?.present();
  };

  const handleQuantityChange = (text: string) => {
    quantityInput.handleChangeText(text);
    setQuantityIsValid((parseQuantity(text) ?? 0) > 0);
  };

  const handleConfirm = () => {
    if (!isValid) return;
    const parsed = parseQuantity(quantityInput.getValue());
    if (parsed === null || parsed <= 0) return;
    onQuantityChange(parsed);
    onUnitChange(normalizedLocalUnit);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable
          onPress={openSheet}
          hapticType="light"
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Set quantity, ${quantity} ${normalizeUnit(unit)}`}
          accessibilityState={{ disabled }}
          className="min-h-11 justify-center"
        >
          <Pill
            textClassName={cn(
              'font-semibold',
              disabled && 'text-muted-foreground'
            )}
            icon={
              <Icon
                className="text-muted-foreground"
                as={ScaleIcon}
                size={16}
              />
            }
            hasValue={true}
            className={cn('min-w-16 justify-between', disabled && 'opacity-50')}
          >
            {displayQuantity}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet
        ref={sheetRef}
        name="unit-sheet"
        onStartOpen={() => quantityInputRef.current?.focus()}
        onFocus={() => quantityInputRef.current?.focus()}
        draggable={false}
        insetAdjustment="never"
      >
        <BottomSheet.Header
          className="px-4"
          title="Set quantity"
          dismissButton={
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
          }
          button={<ConfirmButton onPress={handleConfirm} disabled={!isValid} />}
        />

        <View className="pb-6">
          <View className="px-4">
            <View className="flex-row items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 ">
              <TextInput
                key={quantityInput.inputKey}
                ref={quantityInputRef}
                defaultValue={quantityInput.defaultValue}
                onChangeText={handleQuantityChange}
                keyboardType="decimal-pad"
                submitBehavior="submit"
                onSubmitEditing={handleConfirm}
                className="flex-1 text-2xl font-bold leading-7 text-foreground"
                placeholder="1"
                placeholderTextColor="#9ca3af"
                selectTextOnFocus
                accessibilityLabel="Quantity"
              />
              <DropdownMenuRoot>
                <DropdownMenuTrigger>
                  <View
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`Unit, ${displayUnitLabel}. Change unit`}
                    className="min-h-11 flex-row items-center gap-2 px-2"
                  >
                    <Text className="text-lg text-muted-foreground">
                      {displayUnitLabel || DEFAULT_UNIT_VALUE}
                    </Text>
                    <Icon
                      as={ChevronDownIcon}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {!isCatalogUnit ? (
                    <DropdownMenuCheckboxItem
                      key="current-custom"
                      value="on"
                      onValueChange={() => setLocalUnit(normalizedLocalUnit)}
                    >
                      <DropdownMenuItemTitle>
                        {normalizedLocalUnit}
                      </DropdownMenuItemTitle>
                    </DropdownMenuCheckboxItem>
                  ) : null}
                  {UNIT_OPTIONS.filter(
                    option => option.value !== CUSTOM_UNIT_VALUE
                  ).map(option => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      value={
                        normalizedLocalUnit === option.value ? 'on' : 'off'
                      }
                      onValueChange={() => {
                        setLocalUnit(option.value);
                        quantityInputRef.current?.focus();
                      }}
                    >
                      <DropdownMenuItemTitle>
                        {option.label}
                      </DropdownMenuItemTitle>
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    key="custom"
                    onSelect={() =>
                      editSheetRef.current?.present(
                        isCatalogUnit ? '' : normalizedLocalUnit
                      )
                    }
                  >
                    <DropdownMenuItemTitle>
                      Create custom unit…
                    </DropdownMenuItemTitle>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuRoot>
            </View>
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
