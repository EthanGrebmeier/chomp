import { Button } from '@/components/ui/button';

import { FieldInfo } from '@/components/field-info';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { Platform, View } from 'react-native';
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
import { queryKeys } from '../query-keys';

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
};

export const AddItemSheet = ({ groceryListId }: AddItemSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { mutate: addItem } = useAddGroceryItem();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      name: '',
      quantity: '1',
      unit: 'each',
    },
    onSubmit: e => {
      const { ...formValue } = e.value;
      const unit = formValue.unit;

      if (!verifyUnit(unit)) {
        return;
      }

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
    },
  });

  return (
    <>
      <Button onPress={() => ref.current?.present()}>
        <Text> Add Item </Text>
      </Button>
      <BottomSheet onClose={() => form.reset()} ref={ref}>
        <View className="gap-4 pb-4">
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
              <View className="gap-2">
                <Text>Name: </Text>
                <BottomSheet.TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                />
                <FieldInfo field={field} />
              </View>
            )}
          </form.Field>
          <View className="flex-1 flex-row gap-2">
            <form.Field name="quantity">
              {field => (
                <View className="flex-1 gap-2">
                  <Text>Quantity: </Text>
                  <BottomSheet.TextInput
                    keyboardType="number-pad"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                  />
                </View>
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
                <View className="flex-1 gap-2">
                  <Text>Unit: </Text>
                  <Select
                    value={unitOptions.find(
                      option => option.value === field.state.value
                    )}
                    onValueChange={option =>
                      option && field.handleChange(option?.value)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent
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
          <Button onPress={() => form.handleSubmit()}>
            <Text>Add Item</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
