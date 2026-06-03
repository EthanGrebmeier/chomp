import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../features/grocery-list/components/recipe-conflict-sheet';
import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import {
  RecipeIngredientInput,
  addRecipeToList,
} from '../../../features/recipes/instant/add-recipe-to-list';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { Button } from '../../ui/button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import { IngredientSelector } from './ingredient-selector';
import { RecipeSelector } from './recipe-selector';

type AddMode = 'item' | 'recipe';

type ModeToggleProps = {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
};

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-2">
      <HapticPressable
        onPress={() => onModeChange('item')}
        className={cn(
          'rounded-full px-4 py-2',
          mode === 'item' ? 'bg-primary' : 'bg-muted'
        )}
        hapticType="light"
      >
        <Text
          className={cn(
            'text-base font-semibold',
            mode === 'item'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
          )}
        >
          Item
        </Text>
      </HapticPressable>
      <HapticPressable
        onPress={() => onModeChange('recipe')}
        className={cn(
          'rounded-full px-4 py-2',
          mode === 'recipe' ? 'bg-primary' : 'bg-muted'
        )}
        hapticType="light"
      >
        <Text
          className={cn(
            'text-base font-semibold',
            mode === 'recipe'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
          )}
        >
          Recipe
        </Text>
      </HapticPressable>
    </View>
  );
};

type AddItemSheetProps = {
  groceryListId: string;
  isTriggerVisible?: boolean;
};

const AddItemSheet = ({
  groceryListId,
  isTriggerVisible = true,
}: AddItemSheetProps) => {
  const triggerOpacity = useSharedValue(isTriggerVisible ? 1 : 0);
  const ref = useRef<TrueSheet>(null);
  const {
    reset,
    itemInputRef,
    onSubmit,
    isValid,
    mode: itemSheetMode,
  } = useItemSheet();
  const [mode, setMode] = useState<AddMode>('item');
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<
    Set<string>
  >(new Set());
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [pendingConflictIngredients, setPendingConflictIngredients] = useState<
    RecipeIngredientInput[] | null
  >(null);
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);

  useEffect(() => {
    triggerOpacity.value = withTiming(isTriggerVisible ? 1 : 0, {
      duration: 200,
    });
  }, [isTriggerVisible, triggerOpacity]);

  const triggerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: triggerOpacity.value,
  }));

  const openSheet = () => {
    ref.current?.present();
  };

  const handleClose = () => {
    reset();
    setMode('item');
    setSelectedRecipe(null);
    setPendingConflictIngredients(null);
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
    if (newMode === 'item') {
      setTimeout(() => {
        itemInputRef.current?.focus();
      }, 10);
    }
  };

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setSelectedIngredientIds(
      new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
    );
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setSelectedIngredientIds(new Set());
  };

  const handleAddComplete = () => {
    ref.current?.dismiss();
  };

  const toggleIngredient = (id: string) => {
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

  const toggleAllIngredients = () => {
    if (!selectedRecipe) return;
    setSelectedIngredientIds(prev => {
      const allSelected =
        prev.size === selectedRecipe.recipe_ingredients.length;
      if (allSelected) {
        return new Set();
      }
      return new Set(
        selectedRecipe.recipe_ingredients.map(ingredient => ingredient.id)
      );
    });
  };

  const handleAddRecipeToList = async () => {
    if (!selectedRecipe || selectedIngredientIds.size === 0 || isAddingRecipe) {
      return;
    }

    setIsAddingRecipe(true);
    try {
      const selectedIngredients = selectedRecipe.recipe_ingredients
        .filter(ingredient => selectedIngredientIds.has(ingredient.id))
        .map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes ?? null,
          category: ingredient.category ?? null,
          storeId: ingredient.store?.id,
        }));

      const result = await addRecipeToList({
        recipeId: selectedRecipe.id,
        listId: groceryListId,
        ingredients: selectedIngredients,
      });

      if (result.requiresConflictResolution) {
        setPendingConflictIngredients(selectedIngredients);
        conflictSheetRef.current?.present();
        return;
      }

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${selectedRecipe.name}`
      );
      handleAddComplete();
    } catch {
      toast.error('Failed to add ingredients');
    } finally {
      setIsAddingRecipe(false);
    }
  };

  const resolveConflict = async (resolution: 'increment' | 'separate') => {
    if (!selectedRecipe || !pendingConflictIngredients?.length) return;

    setIsResolvingConflict(true);
    try {
      const result = await addRecipeToList({
        recipeId: selectedRecipe.id,
        listId: groceryListId,
        ingredients: pendingConflictIngredients,
        conflictResolution: resolution,
      });

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${selectedRecipe.name}`
      );
      conflictSheetRef.current?.dismiss();
      setPendingConflictIngredients(null);
      handleAddComplete();
    } catch {
      toast.error('Failed to resolve ingredient conflicts');
    } finally {
      setIsResolvingConflict(false);
    }
  };

  return (
    <>
      <Animated.View
        className="bottom-safe absolute right-6 z-10"
        style={triggerAnimatedStyle}
        pointerEvents={isTriggerVisible ? 'auto' : 'none'}
      >
        <Button size="wide-small" onPress={openSheet}>
          <Icon
            as={PlusIcon}
            size={28}
            strokeWidth={3}
            className="text-primary-foreground"
          />
        </Button>
      </Animated.View>
      <BottomSheet
        detents={[1]}
        name="add-item-sheet"
        ref={ref}
        viewClassName={mode === 'recipe' ? 'flex-1' : undefined}
        onOpen={() => {
          itemInputRef.current?.focus();
        }}
        onDismiss={handleClose}
        scrollable={mode === 'recipe'}
        footer={
          mode === 'item' ? (
            <View className="pb-safe gap-4 px-4">
              <MetaBar />
              <Button
                variant="default"
                size="lg"
                onPress={onSubmit}
                disabled={!isValid}
              >
                <Text className="text-primary-foreground">
                  {itemSheetMode === 'add' ? 'Add Item' : 'Update Item'}
                </Text>
              </Button>
            </View>
          ) : mode === 'recipe' && selectedRecipe ? (
            <View className="pb-safe px-4">
              <Button
                variant="default"
                size="lg"
                onPress={handleAddRecipeToList}
                disabled={
                  selectedIngredientIds.size === 0 ||
                  isAddingRecipe ||
                  isResolvingConflict
                }
              >
                <Text className="text-primary-foreground">Add to List</Text>
              </Button>
            </View>
          ) : undefined
        }
      >
        <View className={mode === 'recipe' ? 'flex-1' : undefined}>
          {!selectedRecipe && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <ModeToggle mode={mode} onModeChange={handleModeChange} />
            </Animated.View>
          )}
          {mode === 'item' ? (
            <View className="px-4">
              <ItemForm />
            </View>
          ) : (
            <View className="flex-1">
              {selectedRecipe ? (
                <Animated.View
                  key="ingredient-selector"
                  className="flex-1"
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(300)}
                >
                  <IngredientSelector
                    recipe={selectedRecipe}
                    onBack={handleBackToRecipes}
                    onDismiss={() => ref.current?.dismiss()}
                    selectedIds={selectedIngredientIds}
                    onToggleIngredient={toggleIngredient}
                    onToggleAll={toggleAllIngredients}
                    showFooter={false}
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  key="recipe-selector"
                  className="flex-1"
                  entering={FadeIn.duration(300)}
                >
                  <RecipeSelector
                    onSelectRecipe={handleRecipeSelect}
                    onDismiss={() => ref.current?.dismiss()}
                  />
                </Animated.View>
              )}
            </View>
          )}
        </View>
      </BottomSheet>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={selectedRecipe?.name ?? 'Recipe'}
        onIncrement={() => {
          void resolveConflict('increment');
        }}
        onCreateSeparate={() => {
          void resolveConflict('separate');
        }}
        onCancel={() => {
          conflictSheetRef.current?.dismiss();
          setPendingConflictIngredients(null);
        }}
        isPending={isResolvingConflict}
      />
    </>
  );
};

type AddItemProps = {
  groceryListId: string;
  isTriggerVisible?: boolean;
};

const AddItem = ({ groceryListId, isTriggerVisible = true }: AddItemProps) => {
  const onSubmit = ({
    item,
    listId,
    selectedCloudSavedItemId,
    selectedCloudSavedItemStoreId,
    selectedLocalSavedItemId,
  }: {
    item: BaseGroceryItem;
    listId?: string;
    selectedCloudSavedItemId?: string;
    selectedCloudSavedItemStoreId?: string;
    selectedLocalSavedItemId?: string;
  }) => {
    if (!listId) return;
    addGroceryListItem({
      listId,
      item,
      savedItemId: selectedCloudSavedItemId,
      selectedCloudSavedItemStoreId,
      selectedLocalSavedItemId,
    });
  };

  return (
    <ItemSheetProvider listId={groceryListId} onSubmit={onSubmit} mode="add">
      <AddItemSheet
        groceryListId={groceryListId}
        isTriggerVisible={isTriggerVisible}
      />
    </ItemSheetProvider>
  );
};

export default AddItem;
