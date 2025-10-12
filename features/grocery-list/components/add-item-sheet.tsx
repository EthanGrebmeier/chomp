import { Button } from '@/components/ui/button';

import { FieldInfo } from '@/components/field-info';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
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
  const itemInputRef =
    useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  const { mutate: addItem } = useAddGroceryItem();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const handleOpen = () => {
    // Focus the input when the bottom sheet opens
    setTimeout(() => {
      itemInputRef.current?.focus();
    }, 10);
  };

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
      <BottomSheet
        onStartClose={() => {
          KeyboardController.dismiss();
        }}
        onOpen={handleOpen}
        onClose={() => form.reset()}
        ref={ref}
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
                <View className="flex-1 items-center gap-2">
                  <BottomSheet.BareTextInput
                    className="w-full text-right text-xl font-semibold text-foreground"
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
                <View className="w-[104px] shrink-0 gap-2 ">
                  <Select
                    className="bg-transparent"
                    value={unitOptions.find(
                      option => option.value === field.state.value
                    )}
                    onValueChange={option =>
                      option && field.handleChange(option?.value)
                    }
                  >
                    <SelectTrigger className="shrink-0 border-0 border-none bg-transparent p-0 shadow-none dark:bg-transparent">
                      <SelectValue
                        className="bg-transparent text-lg font-semibold text-foreground"
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
          <Text>Add Item</Text>
        </Button>
      </BottomSheet>
    </>
  );
};
