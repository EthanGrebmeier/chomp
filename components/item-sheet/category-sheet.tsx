import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  CheckIcon,
  LucideIcon,
  ShoppingBasketIcon,
  TagIcon,
} from 'lucide-react-native';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { categoryOptions } from '../../features/shared/category/categories';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { BottomSheet } from '../bottom-sheet';
import { BackButton } from '../ui/back-button';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
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
        'flex-row items-center gap-3 rounded-xl px-2 py-3',
        isSelected ? 'bg-primary/10' : 'active:bg-muted'
      )}
    >
      <View
        className={cn(
          'size-10 items-center justify-center rounded-full',
          iconContainerClassName ?? 'bg-muted'
        )}
      >
        <Icon as={icon} size={20} className={iconClassName} />
      </View>
      <Text
        className={cn(
          'flex-1 text-lg',
          isSelected && 'font-semibold text-primary'
        )}
      >
        {label}
      </Text>
      {isSelected && <Icon as={CheckIcon} size={20} className="text-primary" />}
    </View>
  </HapticPressable>
);

type CategorySheetProps = {
  category?: string;
  onSelect: (category?: string) => void;
};

export const CategorySheet = ({ category, onSelect }: CategorySheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);

  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  const openSheet = () => {
    sheetRef.current?.present();
  };

  const handleSelect = (value?: string) => {
    onSelect(value);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable onPress={openSheet} hapticType="light">
          <Pill
            icon={
              <Icon
                className={
                  selectedCategory?.style.textClassName ??
                  'text-muted-foreground'
                }
                as={selectedCategory?.style.icon ?? ShoppingBasketIcon}
                size={16}
              />
            }
            className={selectedCategory?.style.className}
            textClassName={cn(
              'font-semibold',
              selectedCategory?.style.textClassName
            )}
            closeIconClassName={selectedCategory?.style.textClassName}
            hasValue={!!selectedCategory}
            onClear={() => onSelect(undefined)}
          >
            {selectedCategory ? selectedCategory.label : 'Category'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      {/* TODO: Fix padding on sheet with scrollable
            Fixing by adding scrollable causes pressables to not work within
          */}
      <BottomSheet ref={sheetRef} name="category-sheet">
        <BottomSheet.Header
          className="px-4"
          title="Category"
          dismissButton={
            <BackButton onPress={() => sheetRef.current?.dismiss()} />
          }
        />
        <ScrollView
          className="max-h-96 px-2"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <CategoryOption
            label="None"
            icon={TagIcon}
            iconClassName="text-muted-foreground"
            isSelected={!category}
            onPress={() => handleSelect(undefined)}
          />

          {categoryOptions.map(categoryOption => (
            <CategoryOption
              key={categoryOption.value}
              label={categoryOption.label}
              icon={categoryOption.style.icon}
              iconClassName={categoryOption.style.textClassName}
              iconContainerClassName={categoryOption.style.className}
              isSelected={category === categoryOption.value}
              onPress={() => handleSelect(categoryOption.value)}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
};
