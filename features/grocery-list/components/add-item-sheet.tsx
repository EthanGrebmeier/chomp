import { Button } from '@/components/ui/button';

import { FieldInfo } from '@/components/field-info';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../../components/bottom-sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Text } from '../../../components/ui/text';
import { useAddGroceryItem } from '../hooks/useAddGroceryListItem';
import { useUpdateGroceryListItem } from '../hooks/useUpdateGroceryListItem';
import { queryKeys } from '../query-keys';
import { GroceryListItem } from '../types';

const unitOptions = [
  { label: 'Each', value: 'each' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Gram', value: 'g' },
  { label: 'Liter', value: 'l' },
  { label: 'Milliliter', value: 'ml' },
  { label: 'Pound', value: 'lb' },
] as const;

const verifyUnit = (
  unit: string
): unit is (typeof unitOptions)[number]['value'] => {
  return unitOptions.some(option => option.value === unit);
};

type AddItemSheetProps = {
  groceryListId: string;
  onClose?: () => void;
  defaultValues: GroceryListItem | null;
};

export type AddItemSheetRef = {
  present: () => void;
};

export const AddItemSheet = forwardRef<AddItemSheetRef, AddItemSheetProps>(
  ({ groceryListId, onClose, defaultValues }, ref) => {
    console.log('defaultValues', defaultValues);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const itemInputRef =
      useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
    const { mutate: addItem } = useAddGroceryItem();
    const { mutate: updateItem } = useUpdateGroceryListItem();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const isEditing = !!defaultValues;

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
    }));

    const handleOpen = () => {
      // Focus the input when the bottom sheet opens
      setTimeout(() => {
        itemInputRef.current?.focus();
      }, 10);
    };

    const form = useForm({
      defaultValues: {
        name: defaultValues?.name || '',
        quantity: defaultValues?.quantity?.toString() || '1',
        unit: defaultValues?.unit || 'each',
      },
      onSubmit: e => {
        const { ...formValue } = e.value;
        const unit = formValue.unit;

        if (!verifyUnit(unit)) {
          return;
        }

        if (isEditing && defaultValues) {
          updateItem(
            {
              itemId: defaultValues.id,
              updates: {
                name: formValue.name,
                unit,
                quantity: parseInt(formValue.quantity),
              },
            },
            {
              onSuccess: () => {
                form.reset({
                  name: '',
                  quantity: '1',
                  unit: 'each',
                });
                queryClient.invalidateQueries({ queryKey: queryKeys.base() });
                bottomSheetRef.current?.dismiss();
                onClose?.();
              },
            }
          );
        } else {
          addItem(
            {
              item: {
                name: formValue.name,
                groceryListId,
                unit,
                quantity: parseInt(formValue.quantity),
              },
            },
            {
              onSuccess: () => {
                form.reset({
                  name: '',
                  quantity: '1',
                  unit: 'each',
                });
                queryClient.invalidateQueries({ queryKey: queryKeys.base() });
              },
            }
          );
        }
      },
    });

    return (
      <>
        <Button onPress={() => bottomSheetRef.current?.present()}>
          <Text> Add Item </Text>
        </Button>
        <BottomSheet
          onStartClose={() => {
            KeyboardController.dismiss();
            form.reset({
              name: '',
              quantity: '1',
              unit: 'each',
            });
            onClose?.();
          }}
          onOpen={handleOpen}
          ref={bottomSheetRef}
        >
          <View className="flex-row gap-4 pb-4">
            <form.Field
              validators={{
                onSubmit: ({ value }) => {
                  if (!value.length) {
                    return 'Name is required';
                  }
                },
              }}
              name="name"
            >
              {field => (
                <View className="flex-1 shrink gap-2">
                  <BottomSheet.BareTextInput
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder="Name"
                    autoCapitalize="words"
                    className="rounded-none border-none text-2xl font-semibold text-foreground"
                    ref={itemInputRef}
                  />
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
            <View className="flex-1 flex-row gap-2">
              <form.Field name="quantity">
                {field => (
                  <BottomSheet.BareTextInput
                    className="flex-1 pb-2 text-right text-xl font-semibold text-foreground"
                    keyboardType="number-pad"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                )}
              </form.Field>
              <form.Field
                validators={{
                  onSubmit: ({ value }) => {
                    if (!value.length) {
                      return 'Unit is required';
                    }
                    if (!verifyUnit(value)) {
                      return 'Invalid unit';
                    }
                  },
                }}
                name="unit"
              >
                {field => (
                  <View className="w-[104px] shrink-0 gap-2 ">
                    <Select
                      className="bg-transparent"
                      value={unitOptions.find(
                        option => option.value === field.state.value
                      )}
                      onValueChange={option =>
                        option &&
                        field.setValue(option.value as typeof field.state.value)
                      }
                    >
                      <SelectTrigger className="shrink-0 border-0 border-none  p-0 shadow-none dark:bg-transparent">
                        <SelectValue
                          className="bg-transparent text-xl font-semibold text-foreground "
                          placeholder="Select Unit"
                        />
                      </SelectTrigger>
                      <SelectContent
                        align="end"
                        side="top"
                        insets={{
                          top: insets.top,
                          bottom: Platform.select({
                            ios: insets.bottom,
                            android: insets.bottom + 24,
                          }),
                          left: 12,
                          right: 12,
                        }}
                        className=" flex-1"
                      >
                        {unitOptions.map(option => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            label={option.label}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </View>
                )}
              </form.Field>
            </View>
          </View>
          <Button onPress={() => form.handleSubmit()}>
            <Text>{isEditing ? 'Update Item' : 'Add Item'}</Text>
          </Button>
        </BottomSheet>
      </>
    );
  }
);
