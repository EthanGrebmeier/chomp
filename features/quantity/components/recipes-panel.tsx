import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';

import { formatQuantity } from '../model';
import type { Recipe } from '../types';

export function RecipesPanel({
  recipes,
  listId,
  canEdit,
  onNew,
  onEdit,
  onAdd,
  onPlan,
}: {
  recipes: Recipe[];
  listId?: string;
  canEdit: boolean;
  onNew: () => void;
  onEdit: (recipe: Recipe) => void;
  onAdd: (recipe: Recipe) => void;
  onPlan: (recipe: Recipe) => void;
}) {
  return (
    <>
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold">Recipes</Text>
        <Button variant="ghost" disabled={!canEdit} onPress={() => onNew()}>
          <Text>New recipe</Text>
        </Button>
      </View>
      {recipes.map(recipe => (
        <View key={recipe.id} className="gap-3 rounded-2xl bg-muted p-4">
          <HapticPressable
            disabled={!canEdit}
            accessibilityRole="button"
            className="min-h-12 justify-center"
            onPress={() => onEdit(recipe)}
          >
            <Text className="text-xl font-semibold">{recipe.name} ›</Text>
          </HapticPressable>
          {recipe.ingredients.map(i => (
            <Text key={i.id} className="text-muted-foreground">
              {i.name} · {formatQuantity(i.quantity)} {i.unit}
            </Text>
          ))}
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              disabled={!canEdit || !listId}
              onPress={() => onAdd(recipe)}
            >
              <Text>Add to list</Text>
            </Button>
            <Button
              className="flex-1"
              disabled={!canEdit}
              onPress={() => onPlan(recipe)}
            >
              <Text>Plan meal</Text>
            </Button>
          </View>
        </View>
      ))}
    </>
  );
}
