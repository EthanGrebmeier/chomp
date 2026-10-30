import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ShoppingCartIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import {
  IngredientSelector,
  IngredientSelectorRef,
} from '@/components/item-sheet/add-item/ingredient-selector';
import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { InlineStoreReviewCard } from '@/features/quantity/app/inline-store-review-card';
import { useInlineStoreReview } from '@/features/quantity/app/use-inline-store-review';
import { useStoreConflictPreview } from '@/features/quantity/app/use-store-conflict-preview';
import { useDefaultStore } from '@/features/stores/instant/use-default-store';
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
  const review = useInlineStoreReview(!!selectedListIdForIngredients);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentHeight = Math.min(height * 0.9, height - insets.top - 12);

  const isOwner = recipe.user?.id === user?.id;
  const fallbackListId = groceryLists?.grocery_lists?.[0]?.id;
  const targetListId = useMemo(
    () => listId ?? fallbackListId ?? null,
    [fallbackListId, listId]
  );
  const targetList = groceryLists?.grocery_lists?.find(
    list => list.id === (selectedListIdForIngredients ?? targetListId)
  );

  const { data: defaultStore } = useDefaultStore();
  const conflictPreview = useStoreConflictPreview(
    selectedListIdForIngredients ?? undefined,
    recipe.recipe_ingredients.filter(item =>
      selectedIngredientIds.has(item.id)
    ),
    defaultStore?.id
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
    review.close();
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
        detents={[contentHeight / height]}
        insetAdjustment="never"
        name="recipe-ingredient-selector-sheet"
        ref={ingredientSelectorSheetRef}
        onStartClose={handleIngredientSelectorDismiss}
        scrollable
        viewClassName="flex-1"
      >
        <View style={{ height: contentHeight }}>
          <View
            className="flex-1"
            pointerEvents={review.pending ? 'none' : 'auto'}
            accessibilityElementsHidden={!!review.pending}
            importantForAccessibility={
              review.pending ? 'no-hide-descendants' : 'auto'
            }
          >
            <BottomSheet.Header
              title="Choose ingredients"
              subtitle={
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
                reviewConflicts={review.review}
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
            <SheetFooter>
              <BottomActionButton
                className="w-full"
                onPress={handleFooterSubmit}
                disabled={selectedIngredientIds.size === 0 || isSubmitting}
              >
                <Text tabularNumbers>
                  {isSubmitting
                    ? 'Adding…'
                    : conflictPreview.needsReview
                      ? conflictPreview.label
                      : `Add ${selectedIngredientIds.size} ingredient${selectedIngredientIds.size === 1 ? '' : 's'}`}
                </Text>
              </BottomActionButton>
            </SheetFooter>
          </View>
          <InlineStoreReviewCard review={review} />
        </View>
      </BottomSheet>
    </>
  );
};
