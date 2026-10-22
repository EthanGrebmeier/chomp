import { useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { OptionDropdown } from '@/components/item-sheet/option-dropdown';
import { MetaBarLayout } from '@/components/meta-bar-layout';
import { ScrollingMetaBar } from '@/components/scrolling-meta-bar';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Text } from '@/components/ui/text';
import { categoryOptions } from '@/features/shared/category/categories';
import {
  getCategorySurfaceClassName,
  getCategoryTextClassName,
  resolveCategoryColor,
} from '@/features/shared/category/category-colors';

import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

export function MetadataBar({
  category,
  store,
  stores,
  disabled,
  onChange,
  children,
}: {
  children?: React.ReactNode;
  category: string;
  store: string;
  stores: string[];
  disabled: boolean;
  onChange: (field: 'category' | 'store', value: string) => Promise<void>;
}) {
  const [picker, setPicker] = useState<'category' | 'store' | null>(null);
  const selectedCategory = categoryOptions.find(c => c.value === category);
  const label = selectedCategory?.label ?? category;
  const categoryColor = category
    ? resolveCategoryColor(category, selectedCategory?.color)
    : undefined;
  return (
    <>
      <MetaBarLayout>
        <ScrollingMetaBar>
          <OptionDropdown
            label="category"
            value={category}
            options={
              category &&
              !categoryOptions.some(option => option.value === category)
                ? [{ value: category, label: category }, ...categoryOptions]
                : categoryOptions
            }
            disabled={disabled}
            onSelect={value => {
              void onChange('category', value ?? '').catch(e =>
                toast.error(String(e))
              );
            }}
            onCreate={() => setPicker('category')}
          >
            <Pill
              hasValue={!!category}
              className={
                categoryColor
                  ? getCategorySurfaceClassName(categoryColor)
                  : undefined
              }
              textClassName={
                categoryColor
                  ? getCategoryTextClassName(categoryColor)
                  : undefined
              }
            >
              {label || 'Category'}
            </Pill>
          </OptionDropdown>
          <OptionDropdown
            label="store"
            value={store}
            options={[...new Set([store, ...stores])]
              .filter(Boolean)
              .map(value => ({ value, label: value }))}
            disabled={disabled}
            onSelect={value => {
              void onChange('store', value ?? '').catch(e =>
                toast.error(String(e))
              );
            }}
            onCreate={() => setPicker('store')}
          >
            <Pill hasValue={!!store}>{store || 'Store'}</Pill>
          </OptionDropdown>
          {children}
        </ScrollingMetaBar>
      </MetaBarLayout>
      {picker ? (
        <CreateMetadataSheet
          kind={picker}
          onSave={value => onChange(picker, value)}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </>
  );
}

function CreateMetadataSheet({
  kind,
  onSave,
  onDismiss,
}: {
  kind: 'category' | 'store';
  onSave: (value: string) => Promise<void>;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  return (
    <Sheet title={`Create a ${kind}`} controller={sheet}>
      <View className="gap-2">
        <BottomSheet.TextInput
          accessibilityLabel={kind === 'store' ? 'Store name' : 'Category name'}
          value={draft}
          onChangeText={setDraft}
          placeholder={`New ${kind}`}
        />
      </View>
      {error ? <Text className="text-destructive">{error}</Text> : null}
      <Button
        disabled={!draft.trim()}
        onPress={() => {
          void onSave(draft.trim())
            .then(() => sheet.dismiss())
            .catch(e => setError(String(e)));
        }}
      >
        <Text>Save {kind}</Text>
      </Button>
    </Sheet>
  );
}
