import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import {
  useCallback,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, View } from 'react-native';

import {
  CreateCategorySheet,
  CreateCategorySheetRef,
} from '../../features/categories/components/create-category-sheet';
import { useCategoryOptions } from '../../features/categories/use-category-options';
import {
  createMissingCategoryOption,
  getCategoryOptionByValue,
  getFallbackCategoryLabel,
} from '../../features/shared/category/categories';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { ConfirmButton } from '../ui/confirm-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';

type CategoryOptionProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

const CategoryOption = ({
  label,
  isSelected,
  onPress,
}: CategoryOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'w-full flex-row items-center justify-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <Text
        className={cn(
          'text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  </HapticPressable>
);

type CategorySheetProps = {
  category?: string | null;
  onSelect: (category?: string) => void;
  hideTrigger?: boolean;
  showBackButton?: boolean;
  sheetName?: string;
  openRequestId?: number;
  disabled?: boolean;
};

export type CategorySheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const CategorySheet = forwardRef<CategorySheetRef, CategorySheetProps>(
  (
    {
      category,
      onSelect,
      hideTrigger = false,
      showBackButton = true,
      sheetName = 'category-sheet',
      openRequestId,
      disabled = false,
    },
    ref
  ) => {
    const sheetRef = useRef<TrueSheet>(null);
    const createCategorySheetRef = useRef<CreateCategorySheetRef>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const { data: categoryOptions, isLoading } = useCategoryOptions();
    const [localCategory, setLocalCategory] = useState<
      string | undefined | null
    >(category);

    const selectedCategoryIndex = categoryOptions.findIndex(
      opt => opt.value === (category ?? undefined)
    );
    const selectedCategory = getCategoryOptionByValue(
      categoryOptions,
      category
    );
    const selectedCategoryLabel =
      selectedCategory?.label ??
      (category ? getFallbackCategoryLabel(category) : undefined);
    const missingLocalCategory =
      localCategory && !getCategoryOptionByValue(categoryOptions, localCategory)
        ? createMissingCategoryOption(localCategory)
        : undefined;

    const openSheet = useCallback(() => {
      if (disabled) return;
      setLocalCategory(category);
      sheetRef.current?.present();
    }, [category, disabled]);

    useEffect(() => {
      if (openRequestId === undefined) {
        return;
      }
      openSheet();
    }, [openRequestId, openSheet]);

    useImperativeHandle(ref, () => ({
      present: openSheet,
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleConfirm = () => {
      if (localCategory === null) {
        return;
      }
      onSelect(localCategory);
      sheetRef.current?.dismiss();
    };

    const handleScrollToSelectedCategory = () => {
      if (selectedCategoryIndex !== -1) {
        scrollViewRef.current?.scrollTo({
          y: selectedCategoryIndex * 60,
          animated: false,
        });
      }
    };

    const handleOpenCreateCategory = () => {
      createCategorySheetRef.current?.present();
    };

    return (
      <>
        {!hideTrigger && (
          <WithLayoutTransition>
            <HapticPressable
              onPress={openSheet}
              hapticType="light"
              disabled={disabled}
            >
              <Pill
                className={cn(
                  !selectedCategoryLabel && 'border-dashed',
                  disabled && 'opacity-50'
                )}
                textClassName={cn(disabled && 'text-muted-foreground')}
                hasValue={!!selectedCategoryLabel}
              >
                {selectedCategoryLabel ?? 'Category'}
              </Pill>
            </HapticPressable>
          </WithLayoutTransition>
        )}

        <BottomSheet
          detents={[0.7]}
          scrollable
          ref={sheetRef}
          onOpen={handleScrollToSelectedCategory}
          name={sheetName}
        >
          <BottomSheet.Header
            className="px-4"
            title="Category"
            dismissButton={
              showBackButton ? (
                <BackButton onPress={() => sheetRef.current?.dismiss()} />
              ) : undefined
            }
            button={
              <ConfirmButton
                onPress={handleConfirm}
                disabled={localCategory === null}
              />
            }
          />
          <View className="px-2">
            <HapticPressable
              onPress={handleOpenCreateCategory}
              hapticType="light"
            >
              <View className="flex-row items-center justify-center gap-3 rounded-xl px-2 py-3">
                <View className="size-4 items-center justify-center rounded-full bg-primary">
                  <Icon
                    className="text-primary-foreground"
                    as={PlusIcon}
                    strokeWidth={3}
                    size={12}
                  />
                </View>
                <Text className="text-base font-bold tracking-[-0.2] text-primary">
                  Create new category
                </Text>
              </View>
            </HapticPressable>

            <CategoryOption
              label="None"
              isSelected={localCategory === undefined}
              onPress={() => setLocalCategory(undefined)}
            />

            {missingLocalCategory ? (
              <CategoryOption
                label={missingLocalCategory.label}
                isSelected={true}
                onPress={() => setLocalCategory(missingLocalCategory.value)}
              />
            ) : null}

            {isLoading ? (
              <View className="py-4">
                <Text className="text-center text-muted-foreground">
                  Loading categories...
                </Text>
              </View>
            ) : (
              categoryOptions.map(categoryOption => (
                <CategoryOption
                  key={categoryOption.value}
                  label={categoryOption.label}
                  isSelected={localCategory === categoryOption.value}
                  onPress={() => setLocalCategory(categoryOption.value)}
                />
              ))
            )}
          </View>
        </BottomSheet>

        <CreateCategorySheet
          ref={createCategorySheetRef}
          sheetName="create-category-from-picker-sheet"
          showBackButton={showBackButton}
          onSaved={({ value }) => setLocalCategory(value)}
        />
      </>
    );
  }
);

CategorySheet.displayName = 'CategorySheet';
