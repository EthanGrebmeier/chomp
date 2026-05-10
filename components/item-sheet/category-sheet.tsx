import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LucideIcon, TagIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { categoryOptions } from '../../features/shared/category/categories';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { ConfirmButton } from '../ui/confirm-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Pill } from '../ui/pill';
import { Text } from '../ui/text';

type CategoryOptionProps = {
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  iconContainerClassName?: string;
  isSelected: boolean;
  onPress: () => void;
};

const CategoryOption = ({
  label,
  icon,
  iconClassName,
  iconContainerClassName,
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
  category?: string;
  onSelect: (category?: string) => void;
};

export const CategorySheet = ({ category, onSelect }: CategorySheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [localCategory, setLocalCategory] = useState<string | undefined>(
    category
  );

  const selectedCategoryIndex = categoryOptions.findIndex(
    opt => opt.value === category
  );
  const selectedCategory = categoryOptions[selectedCategoryIndex];

  const openSheet = () => {
    setLocalCategory(category);
    sheetRef.current?.present();
  };

  const handleConfirm = () => {
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

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable onPress={openSheet} hapticType="light">
          <Pill
            className={cn(!selectedCategory && 'border-dashed')}
            hasValue={!!selectedCategory}
          >
            {selectedCategory ? selectedCategory.label : 'Category'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet
        detents={[0.7]}
        scrollable
        ref={sheetRef}
        onOpen={handleScrollToSelectedCategory}
        name="category-sheet"
      >
        <BottomSheet.Header
          className="mb-0 px-4"
          title="Category"
          dismissButton={
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
          }
          button={<ConfirmButton onPress={handleConfirm} />}
        />
        <View className="px-2">
          <CategoryOption
            label="None"
            icon={TagIcon}
            iconClassName="text-muted-foreground"
            isSelected={!localCategory}
            onPress={() => setLocalCategory(undefined)}
          />

          {categoryOptions.map(categoryOption => (
            <CategoryOption
              key={categoryOption.value}
              label={categoryOption.label}
              icon={categoryOption.style.icon}
              iconClassName={categoryOption.style.textClassName}
              iconContainerClassName={categoryOption.style.className}
              isSelected={localCategory === categoryOption.value}
              onPress={() => setLocalCategory(categoryOption.value)}
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
};
