import { FieldInfo } from '@/components/field-info';
import { Button } from '@/components/ui/button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { useAddGroceryList } from '../hooks/useAddGroceryList';
import { queryKeys } from '../query-keys';

export const AddListSheet = () => {
  const ref = useRef<BottomSheetModal>(null);
  const { mutate: addList } = useAddGroceryList();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Default to today
    },
    onSubmit: e => {
      const { date } = e.value;

      addList(
        {
          list: {
            date,
          },
        },
        {
          onSuccess: () => {
            form.reset({
              date: new Date().toISOString().split('T')[0],
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.base() });
            ref.current?.dismiss();
          },
        }
      );
    },
  });

  return (
    <>
      <Button onPress={() => ref.current?.present()}>
        <Text>Add List</Text>
      </Button>
      <BottomSheet onClose={() => form.reset()} ref={ref}>
        <View className="gap-4 pb-4">
          <form.Field
            validators={{
              onSubmit: ({ value }) => {
                if (!value.length) {
                  return 'Date is required';
                }
                // Basic date validation
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  return 'Invalid date';
                }
              },
            }}
            name="date"
          >
            {field => (
              <View className="gap-2">
                <Text>Date:</Text>
                <BottomSheet.TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder="YYYY-MM-DD"
                />
                <FieldInfo field={field} />
              </View>
            )}
          </form.Field>
          <Button onPress={() => form.handleSubmit()}>
            <Text>Create List</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
