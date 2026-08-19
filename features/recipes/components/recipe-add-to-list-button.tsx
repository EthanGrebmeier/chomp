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
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { ExternalLinkButton } from '@/components/ui/external-link-button';
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
    setSelectedListIdForIngredients(targetListId);
  };

  useEffect(() => {
    if (selectedListIdForIngredients) {
      setSelectedIngredientIds(
        new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
      );
      setIsSubmitting(false);
      ingredientSelectorSheetRef.current?.present();
    }
  }, [recipe.recipe_ingredients, selectedListIdForIngredients]);

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
      <View className="bottom-safe absolute left-6 z-20">
        <Button
          variant="secondary"
          size="wide-small"
          onPress={handleAddToList}
          disabled={!targetListId}
        >
          <Icon
            as={ShoppingCartIcon}
            size={24}
            strokeWidth={3}
            className="text-secondary-foreground"
          />
        </Button>
      </View>
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
              onPress={handleFooterSubmit}
              disabled={selectedIngredientIds.size === 0 || isSubmitting}
            >
              <Text>{isSubmitting ? 'Adding...' : 'Add to List'}</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.Header
          className="px-4"
          title="Choose ingredients"
          description={recipe.name}
          dismissButton={<BackButton onPress={handleIngredientSelectorBack} />}
          button={
            <ExternalLinkButton
              onPress={() =>
                ingredientSelectorRef.current?.openRecipeDetails()
              }
            />
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
          />
        )}
      </BottomSheet>
    </>
  );
};
