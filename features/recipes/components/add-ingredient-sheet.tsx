import { FieldInfo } from '@/components/field-info';
import { Button } from '@/components/ui/button';
import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
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
import { useAddRecipeIngredient } from '../hooks/useAddRecipeIngredient';
import { recipeQueryKeys } from '../query-keys';

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

type AddIngredientSheetProps = {
  recipeId: string;
};

export const AddIngredientSheet = ({ recipeId }: AddIngredientSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { mutate: addIngredient } = useAddRecipeIngredient();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const nameInputRef =
    useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);

  const handleOpen = () => {
    // Focus the input when the bottom sheet opens
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const form = useForm({
    defaultValues: {
      name: '',
      quantity: '1',
      unit: 'each',
      notes: '',
    },
    onSubmit: e => {
      const { ...formValue } = e.value;
      const unit = formValue.unit;

      if (!verifyUnit(unit)) {
        return;
      }

      addIngredient(
        {
          recipeId,
          name: formValue.name,
          quantity: parseInt(formValue.quantity),
          unit,
          notes: formValue.notes || undefined,
        },
        {
          onSuccess: () => {
            form.reset({
              name: '',
              quantity: '1',
              unit: 'each',
              notes: '',
            });
            queryClient.invalidateQueries({
              queryKey: recipeQueryKeys.detail(recipeId),
            });
            queryClient.invalidateQueries({
              queryKey: recipeQueryKeys.lists(),
            });
            ref.current?.dismiss();
          },
        }
      );
    },
  });

  return (
    <>
      <Button onPress={() => ref.current?.present()}>
        <Text>Add Ingredient</Text>
      </Button>
      <BottomSheet onClose={() => form.reset()} onOpen={handleOpen} ref={ref}>
        <View className="gap-4 pb-4">
          <Text className="text-xl font-semibold">Add Ingredient</Text>

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
                  placeholder="Enter ingredient name"
                  autoCapitalize="words"
                  ref={nameInputRef}
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
                    placeholder="1"
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
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
          </View>

          <form.Field name="notes">
            {field => (
              <View className="gap-2">
                <Text>Notes (optional): </Text>
                <BottomSheet.TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder="Add any notes about this ingredient"
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}
          </form.Field>

          <Button onPress={() => form.handleSubmit()}>
            <Text>Add Ingredient</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
