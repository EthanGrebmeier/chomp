import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { CategoryLabel } from '@/components/category-label';
import { MetaBarLayout } from '@/components/meta-bar-layout';
import { ScrollingMetaBar } from '@/components/scrolling-meta-bar';
import { BackButton } from '@/components/ui/back-button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Pill } from '@/components/ui/pill';
import { Text } from '@/components/ui/text';
import { categoryOptions } from '@/features/shared/category/categories';
import { getCategoryTextClassName } from '@/features/shared/category/category-colors';
import { cn } from '@/lib/utils';

import { type DemoItem } from './model';

/** Same metadata primitives as MetaBar, without the live create-store/category paths. */
export function DemoMetaBar({
  item,
  onChange,
}: {
  item: DemoItem;
  onChange: (item: DemoItem) => void;
}) {
  const [picker, setPicker] = useState<'category' | 'store' | null>(null);
  const category = categoryOptions.find(
    option => option.value === (item.category ?? 'produce')
  );
  const hasStore = item.store !== 'No store';
  const disabled = item.status !== 'active' || !item.name.trim();

  return (
    <>
      <MetaBarLayout>
        <ScrollingMetaBar>
          <HapticPressable
            accessibilityRole="button"
            accessibilityLabel="Choose a category"
            disabled={disabled}
            onPress={() => setPicker('category')}
            hapticType="light"
            className="min-h-11 justify-center"
          >
            <Pill
              hasValue={!!category}
              textClassName={
                category ? getCategoryTextClassName(category.color) : undefined
              }
            >
              {category?.label ?? 'Category'}
            </Pill>
          </HapticPressable>
          <HapticPressable
            accessibilityRole="button"
            accessibilityLabel="Choose a store"
            disabled={disabled}
            onPress={() => setPicker('store')}
            hapticType="light"
            className="min-h-11 justify-center"
          >
            <Pill
              hasValue={hasStore}
              textClassName={cn(
                'font-semibold',
                hasStore ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {hasStore ? item.store : 'Store'}
            </Pill>
          </HapticPressable>
        </ScrollingMetaBar>
      </MetaBarLayout>
      {picker ? (
        <DemoMetadataPicker
          key={picker}
          kind={picker}
          value={
            picker === 'category' ? (item.category ?? 'produce') : item.store
          }
          onSelect={value =>
            onChange(
              picker === 'category'
                ? { ...item, category: value }
                : { ...item, store: value }
            )
          }
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </>
  );
}

function DemoMetadataPicker({
  kind,
  value,
  onSelect,
  onDismiss,
}: {
  kind: 'category' | 'store';
  value: string;
  onSelect: (value: string) => void;
  onDismiss: () => void;
}) {
  const ref = useRef<TrueSheet>(null);
  const [selection, setSelection] = useState(value);
  const options =
    kind === 'category'
      ? [{ value: '', label: 'None', color: undefined }, ...categoryOptions]
      : ['No store', 'Whole Foods', 'Farmers market'].map(store => ({
          value: store,
          label: store === 'No store' ? 'None' : store,
          color: undefined,
        }));
  useEffect(() => {
    void ref.current?.present();
  }, []);

  return (
    <BottomSheet ref={ref} detents={[0.7]} scrollable onDismiss={onDismiss}>
      <BottomSheet.Header
        className="px-4"
        title={`Choose a ${kind}`}
        dismissButton={
          <BackButton
            onPress={() => {
              void ref.current?.dismiss();
            }}
          />
        }
        button={
          <ConfirmButton
            onPress={() => {
              onSelect(selection);
              void ref.current?.dismiss();
            }}
          />
        }
      />
      <ScrollView
        className="max-h-96 px-2"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
      >
        {options.map(option => (
          <HapticPressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: selection === option.value }}
            onPress={() => setSelection(option.value)}
            hapticType="selection"
          >
            <View
              className={cn(
                'w-full flex-row items-center justify-center gap-3 rounded-xl px-2 py-3',
                selection === option.value && 'bg-muted'
              )}
            >
              {option.color ? (
                <CategoryLabel
                  color={option.color}
                  containerClassName="self-center"
                  className="text-base font-medium"
                >
                  {option.label}
                </CategoryLabel>
              ) : (
                <Text
                  className={cn(
                    'text-base font-medium',
                    selection === option.value
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {option.label}
                </Text>
              )}
            </View>
          </HapticPressable>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}
