import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { normalizeCategoryName } from '../../shared/category/categories';
import { createCategory } from '../instant/create-category';
import { updateCategory } from '../instant/update-category';
import { CustomCategory } from '../types';

type SavedCategoryPayload = {
  id: string;
  value: string;
};

type CreateCategorySheetProps = {
  sheetName?: string;
  showBackButton?: boolean;
  onSaved?: (category: SavedCategoryPayload) => void;
};

export type CreateCategorySheetRef = {
  present: (category?: CustomCategory) => void;
  dismiss: () => void;
};

export const CreateCategorySheet = forwardRef<
  CreateCategorySheetRef,
  CreateCategorySheetProps
>(
  (
    {
      sheetName = 'create-category-sheet',
      showBackButton = false,
      onSaved,
    },
    ref
  ) => {
    const [editingCategory, setEditingCategory] =
      useState<CustomCategory | null>(null);
    const [canSubmit, setCanSubmit] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const nameInput = useUncontrolledTextInput();
    const nameInputRef = useRef<TextInput>(null);
    const sheetRef = useRef<TrueSheet>(null);
    const isEditing = !!editingCategory;

    const reset = () => {
      nameInput.reset();
      setEditingCategory(null);
      setCanSubmit(false);
      setIsSubmitting(false);
    };

    const present = (category?: CustomCategory) => {
      if (category) {
        setEditingCategory(category);
        nameInput.reset(category.name);
        setCanSubmit(category.name.trim().length > 0);
      } else {
        setEditingCategory(null);
        nameInput.reset();
        setCanSubmit(false);
      }
      sheetRef.current?.present();
    };

    useImperativeHandle(ref, () => ({
      present,
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleNameChange = (name: string) => {
      nameInput.handleChangeText(name);
      setCanSubmit(normalizeCategoryName(name).length > 0);
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
            categoryId: editingCategory.id,
            updates: { name },
          });
          onSaved?.({ id: editingCategory.id, value: editingCategory.value });
        } else {
          const category = await createCategory({ name });
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
            title={isEditing ? 'Edit Category' : 'Add Category'}
            dismissButton={
              showBackButton ? (
                <BackButton onPress={() => sheetRef.current?.dismiss()} />
              ) : undefined
            }
          />
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
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

CreateCategorySheet.displayName = 'CreateCategorySheet';

type CategorySheetContextType = {
  present: (category?: CustomCategory) => void;
};

const CategorySheetContext = createContext<CategorySheetContextType | null>(null);

export const useCategorySheet = () => {
  const context = useContext(CategorySheetContext);
  if (!context) {
    throw new Error('useCategorySheet must be used within a CategorySheetProvider');
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
