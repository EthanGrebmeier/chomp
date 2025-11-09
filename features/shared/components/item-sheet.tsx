import { BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import { PlusIcon } from 'lucide-react-native';
import { ReactNode, forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldInfo } from '@/components/field-info';
import { Button } from '@/components/ui/button';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Icon } from '../../../components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { QuantityUnit } from '../types';

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

export type ItemFormData = {
  name: string;
  quantity: string;
  unit: QuantityUnit;
  category?: string | null;
};

export type ItemSheetProps = {
  onClose?: () => void;
  defaultValues?: ItemFormData | null;
  onSubmit: (data: ItemFormData) => void;
  namePlaceholder?: string;
  buttonText?: string;
  showAddButton?: boolean;
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
      categoryComponent,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const nameInputRef =
      useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
    const quantityInputRef =
      useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const isEditing = !!defaultValues;

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const handleOpen = () => {
      // Focus the input when the bottom sheet opens
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 10);
    };

    const form = useForm({
      defaultValues: {
        name: defaultValues?.name ?? '',
        quantity: defaultValues?.quantity ?? '1',
        unit: defaultValues?.unit ?? 'each',
        category: defaultValues?.category ?? '',
      },
      onSubmit: e => {
        const { ...formValue } = e.value;
        const unit = formValue.unit;

        if (!verifyUnit(unit)) {
          return;
        }

        onSubmit({
          name: formValue.name,
          quantity: formValue.quantity,
          unit,
          category:
            formValue.category === ''
              ? null
              : (formValue.category ?? undefined),
        });
        form.reset();
        nameInputRef.current?.focus();
      },
    });

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
            onPress={() => bottomSheetRef.current?.present()}
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
          onStartClose={handleClose}
          onOpen={handleOpen}
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
                    returnKeyType="done"
                    autoCapitalize="words"
                    className="rounded-none border-none text-2xl font-semibold text-foreground"
                    ref={nameInputRef}
                  />
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
            <View className="w-[164px] flex-row gap-2 ">
              <form.Field name="quantity">
                {field => (
                  <BottomSheet.BareTextInput
                    className="h-8 min-w-8 text-start text-xl font-semibold text-foreground"
                    keyboardType="numeric"
                    placeholder="1"
                    value={field.state.value}
                    ref={quantityInputRef}
                    onChangeText={field.handleChange}
                    onFocus={e => {
                      quantityInputRef.current?.setNativeProps({
                        selection: {
                          start: field.state.value.length + 1,
                          end: field.state.value.length + 1,
                        },
                      });
                    }}
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
