import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon } from 'lucide-react-native';
import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Alert, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { DeleteButton } from '../../../components/ui/delete-button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { cn } from '../../../lib/utils';
import {
  CategoryOption,
  normalizeCategoryName,
} from '../../shared/category/categories';
import {
  CategoryColor,
  categoryColorOptions,
  getCategoryBackgroundClassName,
} from '../../shared/category/category-colors';
import { createCategory } from '../instant/create-category';
import { deleteCategory } from '../instant/delete-category';
import { updateCategory } from '../instant/update-category';

type SavedCategoryPayload = {
  value: string;
};

type CreateCategorySheetProps = {
  sheetName?: string;
  showBackButton?: boolean;
  onSaved?: (category: SavedCategoryPayload) => void;
};

export type CreateCategorySheetRef = {
  present: (category?: CategoryOption) => void;
  dismiss: () => void;
};

export const CreateCategorySheet = forwardRef<
  CreateCategorySheetRef,
  CreateCategorySheetProps
>(
  (
    { sheetName = 'create-category-sheet', showBackButton = false, onSaved },
    ref
  ) => {
    const [editingCategory, setEditingCategory] =
      useState<CategoryOption | null>(null);
    const [canSubmit, setCanSubmit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedColor, setSelectedColor] = useState<CategoryColor>('green');
    const nameInput = useUncontrolledTextInput();
    const nameInputRef = useRef<TextInput>(null);
    const sheetRef = useRef<TrueSheet>(null);
    const isEditing = !!editingCategory;

    const reset = () => {
      nameInput.reset();
      setEditingCategory(null);
      setCanSubmit(false);
      setIsSubmitting(false);
      setSelectedColor('green');
    };

    const present = (category?: CategoryOption) => {
      if (category) {
        setEditingCategory(category);
        nameInput.reset(category.label);
        setCanSubmit(category.label.trim().length > 0);
        setSelectedColor(category.color);
      } else {
        setEditingCategory(null);
        nameInput.reset();
        setCanSubmit(false);
        setSelectedColor('green');
      }
      sheetRef.current?.present();
    };

    useImperativeHandle(ref, () => ({
      present,
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleNameChange = (name: string) => {
      nameInput.handleChangeText(name);
      const normalizedName = normalizeCategoryName(name);
      setCanSubmit(normalizedName.length > 0);
    };

    const handleSubmit = async () => {
      const name = normalizeCategoryName(nameInput.getValue());
      if (!name) {
        toast.error('Category name cannot be empty');
        return;
      }

      setIsSubmitting(true);
      try {
        if (isEditing && editingCategory) {
          await updateCategory({
            category: editingCategory,
            updates: { name, color: selectedColor },
          });
          onSaved?.({ value: editingCategory.value });
        } else {
          const category = await createCategory({
            name,
            color: selectedColor,
          });
          onSaved?.(category);
        }
        sheetRef.current?.dismiss();
        reset();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : isEditing
              ? 'Failed to update category'
              : 'Failed to create category'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDelete = async (category: CategoryOption) => {
      setIsSubmitting(true);
      try {
        await deleteCategory({ category });
        sheetRef.current?.dismiss();
        reset();
      } catch {
        toast.error('Failed to delete category');
        setIsSubmitting(false);
      }
    };

    const handleConfirmDelete = () => {
      if (!editingCategory) return;
      const category = editingCategory;
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.label}"? Existing items will keep their category label.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void handleDelete(category),
          },
        ]
      );
    };

    const submitLabel = isEditing ? 'Update' : 'Create';

    return (
      <BottomSheet
        name={sheetName}
        ref={sheetRef}
        onStartClose={reset}
        onOpen={() => {
          nameInputRef.current?.focus();
        }}
        footer={
          <View className="px-10 pb-4">
            <Button
              variant="default"
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <Text>{submitLabel}</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            title={isEditing ? 'Edit category' : 'Add a category'}
            dismissButton={
              showBackButton ? (
                <BackButton onPress={() => sheetRef.current?.dismiss()} />
              ) : undefined
            }
            button={
              isEditing ? (
                <DeleteButton
                  accessibilityLabel="Delete category"
                  onPress={handleConfirmDelete}
                  disabled={isSubmitting}
                />
              ) : undefined
            }
          />
          <View className="gap-6">
            <View>
              <Text className="mb-2 text-sm font-medium text-muted-foreground">
                Category Name
              </Text>
              <BottomSheet.TextInput
                ref={nameInputRef}
                key={nameInput.inputKey}
                defaultValue={nameInput.defaultValue}
                onChangeText={handleNameChange}
                placeholder="Bulk Foods"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!isSubmitting}
              />
            </View>

            <View className="gap-3">
              <Text className="text-sm font-medium text-muted-foreground">
                Color
              </Text>
              <View
                accessibilityRole="radiogroup"
                className="flex-row flex-wrap"
              >
                {categoryColorOptions.map(option => {
                  const isSelected = selectedColor === option.value;
                  return (
                    <HapticPressable
                      key={option.value}
                      accessibilityLabel={`${option.label} category color`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className="h-11 w-1/4 items-center justify-center"
                      disabled={isSubmitting}
                      hapticType="selection"
                      onPress={() => setSelectedColor(option.value)}
                    >
                      <View
                        className={cn(
                          'size-8 items-center justify-center rounded-full border-2',
                          getCategoryBackgroundClassName(option.value),
                          isSelected
                            ? 'border-foreground'
                            : 'border-transparent'
                        )}
                      >
                        {isSelected ? (
                          <Icon
                            as={CheckIcon}
                            className="text-category-contrast-light dark:text-category-contrast-dark"
                            size={16}
                            strokeWidth={3}
                          />
                        ) : null}
                      </View>
                    </HapticPressable>
                  );
                })}
              </View>
            </View>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

CreateCategorySheet.displayName = 'CreateCategorySheet';

type CategorySheetContextType = {
  present: (category?: CategoryOption) => void;
};

const CategorySheetContext = createContext<CategorySheetContextType | null>(
  null
);

export const useCategorySheet = () => {
  const context = useContext(CategorySheetContext);
  if (!context) {
    throw new Error(
      'useCategorySheet must be used within a CategorySheetProvider'
    );
  }
  return context;
};

type CategorySheetProviderProps = {
  children: React.ReactNode;
};

export const CategorySheetProvider = ({
  children,
}: CategorySheetProviderProps) => {
  const sheetRef = useRef<CreateCategorySheetRef>(null);

  return (
    <CategorySheetContext.Provider
      value={{ present: category => sheetRef.current?.present(category) }}
    >
      <CreateCategorySheet ref={sheetRef} />
      {children}
    </CategorySheetContext.Provider>
  );
};
