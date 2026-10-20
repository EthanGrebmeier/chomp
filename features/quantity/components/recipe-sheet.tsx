import { useState } from 'react';
import { View } from 'react-native';

import { ItemNameField } from '@/components/item-sheet/item-fields';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import type { Recipe } from '../types';

import { emptyIngredient, IngredientFields } from './ingredient-form';
import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

export function RecipeSheet({
  recipe,
  newId,
  onSave,
  onDismiss,
}: {
  recipe?: Recipe;
  newId: () => string;
  onSave: (recipe: Recipe) => Promise<void>;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const [draft, setDraft] = useState<Recipe>(
    () =>
      recipe ?? {
        kind: 'recipe',
        id: newId(),
        name: '',
        ingredients: [emptyIngredient(newId())],
      }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title={recipe ? 'Edit recipe' : 'New recipe'} controller={sheet}>
      <ItemNameField
        accessibilityLabel="Recipe name"
        placeholder="Recipe name"
        value={draft.name}
        onChangeText={name => setDraft({ ...draft, name })}
      />
      <Text className="text-sm text-muted-foreground">
        Recipe changes update planned quantities without changing earlier direct
        additions.
      </Text>
      {draft.ingredients.map((item, index) => (
        <View key={item.id} className="gap-3 border-t border-border pt-4">
          <Text className="font-semibold">Ingredient {index + 1}</Text>
          <IngredientFields
            value={item}
            onChange={value =>
              setDraft({
                ...draft,
                ingredients: draft.ingredients.map(i =>
                  i.id === item.id ? value : i
                ),
              })
            }
          />
          <Button
            variant="ghost"
            onPress={() =>
              setDraft({
                ...draft,
                ingredients: draft.ingredients.filter(i => i.id !== item.id),
              })
            }
          >
            <Text className="text-destructive">Remove ingredient</Text>
          </Button>
        </View>
      ))}
      <Button
        variant="outline"
        onPress={() =>
          setDraft({
            ...draft,
            ingredients: [...draft.ingredients, emptyIngredient(newId())],
          })
        }
      >
        <Text>Add ingredient</Text>
      </Button>
      {error ? <Text className="text-destructive">{error}</Text> : null}
      <Button
        disabled={
          busy ||
          !draft.name.trim() ||
          draft.ingredients.length === 0 ||
          draft.ingredients.some(
            i => !i.name.trim() || !Number.isFinite(i.quantity)
          )
        }
        onPress={() => {
          setBusy(true);
          void onSave(draft)
            .then(() => sheet.dismiss())
            .catch(e => setError(String(e)))
            .finally(() => setBusy(false));
        }}
      >
        <Text>Save recipe</Text>
      </Button>
    </Sheet>
  );
}
