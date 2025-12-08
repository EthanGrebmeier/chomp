import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useForm } from '@tanstack/react-form';
import { PlusIcon, ScaleIcon } from 'lucide-react-native';
import { ReactNode, forwardRef, useImperativeHandle, useRef } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { FieldInfo } from '@/components/field-info';
import { Button } from '@/components/ui/button';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';

import { UnitSelector } from './unit-selector';

export type ItemFormData = {
  name: string;
  quantity: string;
  unit: string;
  category?: string;
};

export type ItemSheetProps = {
  onClose?: () => void;
  defaultValues?: ItemFormData | null;
  onSubmit: (data: ItemFormData) => void;
  namePlaceholder?: string;
  buttonText?: string;
  showAddButton?: boolean;
  sheetName?: string;
  categoryComponent?: (
    category: string,
    onSelect: (category?: string) => void
  ) => ReactNode;
};

export type ItemSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const ItemSheet = forwardRef<ItemSheetRef, ItemSheetProps>(
  (
    {
      onClose,
      defaultValues,
      onSubmit,
      namePlaceholder = 'Name',
      buttonText,
      showAddButton = true,
      sheetName,
      categoryComponent,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<TrueSheet>(null);
    const nameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const quantityInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const theme = useTheme();
    const isEditing = !!defaultValues;

    const form = useForm({
      defaultValues: {
        name: defaultValues?.name ?? '',
        quantity: defaultValues?.quantity ?? '1',
        unit: defaultValues?.unit ?? 'each',
        category: defaultValues?.category ?? '',
      },
      onSubmit: e => {
        const { ...formValue } = e.value;

        onSubmit({
          name: formValue.name,
          quantity: formValue.quantity,
          unit: formValue.unit,
          category:
            formValue.category === ''
              ? undefined
              : (formValue.category ?? undefined),
        });
        form.reset();
        nameInputRef.current?.focus();
      },
    });

    useImperativeHandle(ref, () => ({
      present: () => {
        // Reset form values when sheet is presented to ensure fresh data
        if (defaultValues) {
          form.reset({
            name: defaultValues.name ?? '',
            quantity: defaultValues.quantity ?? '1',
            unit: defaultValues.unit ?? 'each',
            category: defaultValues.category ?? '',
          });
        }
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const handleSubmit = () => {
      form.handleSubmit();
    };

    const resetForm = () => {
      form.reset({
        name: '',
        quantity: '1',
        unit: 'each',
        category: '',
      });
    };

    const handleClose = () => {
      KeyboardController.dismiss();
      resetForm();
      onClose?.();
    };

    return (
      <>
        {showAddButton && (
          <Button
            size="iconLg"
            onPress={() => {
              bottomSheetRef.current?.present();
              nameInputRef.current?.focus();
            }}
            hapticType="medium"
          >
            <Icon
              as={PlusIcon}
              color={theme.primaryForeground}
              strokeWidth={3.5}
              className="size-10"
            />
          </Button>
        )}
        <BottomSheet
          name={sheetName}
          onStartClose={handleClose}
          ref={bottomSheetRef}
        >
          <View className="gap-2 pb-4">
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
                <View className="flex-1 gap-2 ">
                  <BottomSheet.BareTextInput
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    placeholder={namePlaceholder}
                    returnKeyType="none"
                    autoCapitalize="words"
                    className="rounded-none border-none text-2xl font-semibold text-foreground"
                    ref={nameInputRef}
                  />
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
            <View className="flex-row items-center gap-2 ">
              <Icon as={ScaleIcon} size={16} />
              <form.Field name="quantity">
                {field => (
                  <View className="flex-row items-center gap-2">
                    <BottomSheet.BareTextInput
                      className="mb-2 h-8 w-full min-w-4 text-start text-xl font-semibold text-foreground"
                      style={{
                        textAlignVertical: 'center',
                      }}
                      keyboardType="numeric"
                      placeholder="1"
                      textAlignVertical="center"
                      numberOfLines={1}
                      value={field.state.value}
                      ref={quantityInputRef}
                      onChangeText={field.handleChange}
                      onFocus={e => {
                        quantityInputRef.current?.setNativeProps({
                          selection: {
                            start: field.state.value.length,
                            end: field.state.value.length,
                          },
                        });
                      }}
                    />
                  </View>
                )}
                {}
              </form.Field>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row items-center gap-2"
            >
              <form.Field name="category">
                {field => (
                  <View className="gap-2">
                    {categoryComponent ? (
                      categoryComponent(field.state.value, category =>
                        field.setValue(category ?? '')
                      )
                    ) : (
                      <Text className="text-sm text-muted-foreground">
                        Category: {field.state.value ?? 'None'}
                      </Text>
                    )}
                  </View>
                )}
              </form.Field>
              <form.Field name="unit">
                {field => (
                  <UnitSelector
                    unit={field.state.value}
                    onSelect={field.handleChange}
                  />
                )}
              </form.Field>
            </ScrollView>
          </View>
          <Button onPress={handleSubmit}>
            <Text>
              {buttonText ?? (isEditing ? 'Update Item' : 'Add Item')}
            </Text>
          </Button>
        </BottomSheet>
      </>
    );
  }
);

ItemSheet.displayName = 'ItemSheet';
