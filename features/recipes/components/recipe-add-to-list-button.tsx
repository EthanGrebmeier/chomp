import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ShoppingCartIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  IngredientSelector,
  IngredientSelectorRef,
} from '@/components/item-sheet/add-item/ingredient-selector';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { db } from '@/lib/instant';
import { navigation } from '@/lib/navigation';

import { useGroceryLists } from '../../grocery-lists/instant/useGroceryLists';
import { RecipeWithIngredients } from '../types';

type RecipeAddToListButtonProps = {
  recipe: RecipeWithIngredients;
  listId?: string;
};

export const RecipeAddToListButton = ({
  recipe,
  listId,
}: RecipeAddToListButtonProps) => {
  const { user } = db.useAuth();
  const { data: groceryLists } = useGroceryLists();
  const ingredientSelectorSheetRef = useRef<TrueSheet>(null);
  const ingredientSelectorRef = useRef<IngredientSelectorRef>(null);
  const [selectedListIdForIngredients, setSelectedListIdForIngredients] =
    useState<string | null>(null);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<
    Set<string>
  >(new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = recipe.user?.id === user?.id;
  const fallbackListId = groceryLists?.grocery_lists?.[0]?.id;
  const targetListId = useMemo(
    () => listId ?? fallbackListId ?? null,
    [fallbackListId, listId]
  );
  const targetList = groceryLists?.grocery_lists?.find(
    list => list.id === (selectedListIdForIngredients ?? targetListId)
  );

  const handleIngredientSelectorComplete = () => {
    const listIdToNavigate = selectedListIdForIngredients;
    ingredientSelectorSheetRef.current?.dismiss();
    setSelectedListIdForIngredients(null);
    setIsSubmitting(false);
    if (listIdToNavigate) {
      router.dismissTo(navigation.goToList(listIdToNavigate), {
        withAnchor: true,
      });
    }
  };

  const handleIngredientSelectorDismiss = () => {
    setSelectedListIdForIngredients(null);
    setIsSubmitting(false);
  };

  const handleIngredientSelectorBack = () => {
    ingredientSelectorSheetRef.current?.dismiss();
    setSelectedListIdForIngredients(null);
  };

  const handleAddToList = () => {
    if (!targetListId) {
      toast.error('No grocery list available');
      return;
    }
    setSelectedIngredientIds(
      new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
    );
    setIsSubmitting(false);
    setSelectedListIdForIngredients(targetListId);
  };

  useEffect(() => {
    if (selectedListIdForIngredients) {
      ingredientSelectorSheetRef.current?.present();
    }
  }, [selectedListIdForIngredients]);

  const handleToggleIngredient = (id: string) => {
    setSelectedIngredientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllIngredients = () => {
    setSelectedIngredientIds(prev => {
      if (prev.size === recipe.recipe_ingredients.length) {
        return new Set();
      }
      return new Set(
        recipe.recipe_ingredients.map(ingredient => ingredient.id)
      );
    });
  };

  const handleFooterSubmit = () => {
    ingredientSelectorRef.current?.submit();
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Button
        className="h-11 self-start px-4"
        onPress={handleAddToList}
        disabled={!targetListId}
      >
        <Icon
          as={ShoppingCartIcon}
          size={18}
          strokeWidth={2.5}
          className="text-primary-foreground"
        />
        <Text>Add to list</Text>
      </Button>
      <BottomSheet
        detents={['auto']}
        name="recipe-ingredient-selector-sheet"
        ref={ingredientSelectorSheetRef}
        onStartClose={handleIngredientSelectorDismiss}
        scrollable
        viewClassName="flex-1"
        footer={
          <View className="px-4 pb-4 pt-3">
            <Button
              className="min-h-11 w-full"
              onPress={handleFooterSubmit}
              disabled={selectedIngredientIds.size === 0 || isSubmitting}
            >
              <Text tabularNumbers>
                {isSubmitting
                  ? 'Adding…'
                  : `Add ${selectedIngredientIds.size} ingredient${selectedIngredientIds.size === 1 ? '' : 's'}`}
              </Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.Header
          className="px-4"
          title="Choose ingredients"
          description={
            <>
              {recipe.name}
              {'\n'}
              <Text variant="caption">
                {targetList?.name
                  ? `Adding to ${targetList.name}`
                  : 'Adding to your grocery list'}
              </Text>
            </>
          }
        />
        {selectedListIdForIngredients && (
          <IngredientSelector
            ref={ingredientSelectorRef}
            recipe={recipe}
            listId={selectedListIdForIngredients}
            onBack={handleIngredientSelectorBack}
            onComplete={handleIngredientSelectorComplete}
            onDismiss={() => ingredientSelectorSheetRef.current?.dismiss()}
            selectedIds={selectedIngredientIds}
            onToggleIngredient={handleToggleIngredient}
            onToggleAll={handleToggleAllIngredients}
            onBusyStateChange={setIsSubmitting}
            showFooter={false}
            showHeader={false}
            selectionHeader="compact"
          />
        )}
      </BottomSheet>
    </>
  );
};
