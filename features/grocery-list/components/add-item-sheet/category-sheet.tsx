import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LucideIcon, TagIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { WithLayoutTransition } from '../../../../components/animated/with-layout-transition';
import { BottomSheet } from '../../../../components/bottom-sheet';
import { BackButton } from '../../../../components/ui/back-button';
import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Icon } from '../../../../components/ui/icon';
import { Pill } from '../../../../components/ui/pill';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';
import { categoryOptions } from '../../../shared/category/categories';

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
        isSelected && 'bg-muted'
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
          'flex-1 text-base font-medium',
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
                as={selectedCategory ? selectedCategory.style.icon : TagIcon}
                className={
                  selectedCategory
                    ? selectedCategory.style.textClassName
                    : 'text-muted-foreground'
                }
                size={16}
              />
            }
            className={cn(
              'border border-border',
              selectedCategory
                ? selectedCategory.style.className
                : 'bg-transparent'
            )}
            textClassName={cn(
              selectedCategory
                ? selectedCategory.style.textClassName
                : 'text-muted-foreground'
            )}
            hasValue={!!selectedCategory}
            onClear={() => onSelect(undefined)}
          >
            {selectedCategory ? selectedCategory.label : 'Category'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet ignoreSafeArea ref={sheetRef} name="category-sheet">
        <View className="flex-row items-center gap-2 pb-2">
          <BackButton onPress={() => sheetRef.current?.dismiss()} />
          <BottomSheet.Header title="Category" />
        </View>
        <ScrollView
          className="max-h-96"
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
