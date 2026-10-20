import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { MetaBarLayout } from '@/components/meta-bar-layout';
import { ScrollingMetaBar } from '@/components/scrolling-meta-bar';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Pill } from '@/components/ui/pill';
import { Text } from '@/components/ui/text';
import { categoryOptions } from '@/features/shared/category/categories';

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
  const label =
    categoryOptions.find(c => c.value === category)?.label ?? category;
  return (
    <>
      <MetaBarLayout>
        <ScrollingMetaBar>
          <HapticPressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Choose a category"
            onPress={() => setPicker('category')}
            className="min-h-11 justify-center"
          >
            <Pill hasValue={!!category}>{label || 'Category'}</Pill>
          </HapticPressable>
          <HapticPressable
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Choose a store"
            onPress={() => setPicker('store')}
            className="min-h-11 justify-center"
          >
            <Pill hasValue={!!store}>{store || 'Store'}</Pill>
          </HapticPressable>
          {children}
        </ScrollingMetaBar>
      </MetaBarLayout>
      {picker ? (
        <MetadataPicker
          kind={picker}
          value={picker === 'category' ? category : store}
          stores={stores}
          onSave={value => onChange(picker, value)}
          onDismiss={() => setPicker(null)}
        />
      ) : null}
    </>
  );
}

function MetadataPicker({
  kind,
  value,
  stores,
  onSave,
  onDismiss,
}: {
  kind: 'category' | 'store';
  value: string;
  stores: string[];
  onSave: (value: string) => Promise<void>;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  const options =
    kind === 'category'
      ? categoryOptions.map(c => ({ value: c.value, label: c.label }))
      : [...new Set(['', ...stores])].map(value => ({
          value,
          label: value || 'No store',
        }));
  return (
    <Sheet title={`Choose a ${kind}`} controller={sheet}>
      <View className="gap-2">
        <BottomSheet.TextInput
          accessibilityLabel={kind === 'store' ? 'Store name' : 'Category name'}
          value={draft}
          onChangeText={setDraft}
          placeholder={`New ${kind}`}
        />
        {options.map(option => (
          <HapticPressable
            key={`${option.value}:${draft === option.value}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: draft === option.value }}
            onPress={() => setDraft(option.value)}
            className={`min-h-12 justify-center rounded-xl px-3 ${draft === option.value ? 'bg-muted' : ''}`}
          >
            <Text>{option.label}</Text>
          </HapticPressable>
        ))}
      </View>
      {error ? <Text className="text-destructive">{error}</Text> : null}
      <Button
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
