import { FieldInfo } from '@/components/field-info';
import { Button } from '@/components/ui/button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
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
      name: '', // Default empty name
    },
    onSubmit: e => {
      const { date, name } = e.value;

      addList(
        {
          list: {
            date,
            name,
          },
        },
        {
          onSuccess: () => {
            form.reset({
              date: new Date().toISOString().split('T')[0],
              name: '',
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
        <Text>New List</Text>
      </Button>
      <BottomSheet onClose={() => form.reset()} ref={ref}>
        <View className="gap-4 pb-4">
          <form.Field
            validators={{
              onSubmit: ({ value }) => {
                if (!value.trim()) {
                  return 'Name is required';
                }
                if (value.trim().length < 2) {
                  return 'Name must be at least 2 characters';
                }
              },
            }}
            name="name"
          >
            {field => (
              <View className="gap-2">
                <Text>Name:</Text>
                <BottomSheet.TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder="Enter list name"
                />
                <FieldInfo field={field} />
              </View>
            )}
          </form.Field>
          <form.Field
            validators={{
              onSubmit: ({ value }) => {
                if (!value) {
                  return 'Date is required';
                }
              },
            }}
            name="date"
          >
            {field => (
              <View className="gap-2">
                <Text>Date:</Text>
                <DateTimePicker
                  value={
                    field.state.value ? new Date(field.state.value) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      field.handleChange(
                        selectedDate.toISOString().split('T')[0]
                      );
                    }
                  }}
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
