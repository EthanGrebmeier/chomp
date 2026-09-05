import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { toast } from 'sonner-native';

import { FrequentItemsScreen } from '../../../features/frequent-items/components/frequent-items-screen';
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
import { useDefaultStore } from '../../../features/stores/instant/use-default-store';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { BackButton } from '../../ui/back-button';
import { Button } from '../../ui/button';
import { ExternalLinkButton } from '../../ui/external-link-button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import {
  IngredientSelector,
  IngredientSelectorRef,
} from './ingredient-selector';
import { RecipeSelector } from './recipe-selector';

const ADD_MODES = ['item', 'recipe', 'recent'] as const;

type AddMode = (typeof ADD_MODES)[number];

const ADD_MODE_INDEX: Record<AddMode, number> = {
  item: 0,
  recipe: 1,
  recent: 2,
};

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
      <HapticPressable
        onPress={() => onModeChange('recent')}
        className={cn(
          'rounded-full px-4 py-2',
          mode === 'recent' ? 'bg-primary' : 'bg-muted'
        )}
        hapticType="light"
      >
        <Text
          className={cn(
            'text-base font-semibold',
            mode === 'recent'
              ? 'text-primary-foreground'
              : 'text-muted-foreground'
          )}
        >
          Recent
        </Text>
      </HapticPressable>
    </View>
  );
};

type AddItemSheetProps = {
  groceryListId: string;
  defaultStore?: { id: string; name: string } | null;
  isTriggerVisible?: boolean;
  isItemAdded: boolean;
  onItemAddedFeedbackComplete: () => void;
};

const AddItemSheet = ({
  groceryListId,
  defaultStore,
  isTriggerVisible = true,
  isItemAdded,
  onItemAddedFeedbackComplete,
}: AddItemSheetProps) => {
  const { height: windowHeight } = useWindowDimensions();
  const triggerOpacity = useSharedValue(isTriggerVisible ? 1 : 0);
  const itemFooterOpacity = useSharedValue(1);
  const ref = useRef<TrueSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const isSheetOpenRef = useRef(false);
  const {
    reset,
    itemInputRef,
    onSubmit,
    isValid,
    isSubmitting,
    mode: itemSheetMode,
  } = useItemSheet();
  const [mode, setMode] = useState<AddMode>('item');
  const [isItemFooterMounted, setIsItemFooterMounted] = useState(true);
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
  const ingredientSelectorRef = useRef<IngredientSelectorRef>(null);

  useEffect(() => {
    triggerOpacity.set(
      withTiming(isTriggerVisible ? 1 : 0, {
        duration: 200,
      })
    );
  }, [isTriggerVisible, triggerOpacity]);

  const triggerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: triggerOpacity.get(),
  }));

  const itemFooterAnimatedStyle = useAnimatedStyle(() => ({
    opacity: itemFooterOpacity.get(),
  }));

  const unmountItemFooter = () => {
    setIsItemFooterMounted(false);
  };

  const showItemFooter = () => {
    setIsItemFooterMounted(true);
    itemFooterOpacity.set(withTiming(1, { duration: 200 }));
  };

  const hideItemFooter = () => {
    itemFooterOpacity.set(
      withTiming(0, { duration: 200 }, finished => {
        if (finished) {
          scheduleOnRN(unmountItemFooter);
        }
      })
    );
  };

  const openSheet = () => {
    reset();
    ref.current?.present();
  };

  const handleClose = () => {
    isSheetOpenRef.current = false;
    itemInputRef.current?.blur();
    reset();
    onItemAddedFeedbackComplete();
    setMode('item');
    setIsItemFooterMounted(true);
    itemFooterOpacity.set(1);
    pagerRef.current?.setPageWithoutAnimation(ADD_MODE_INDEX.item);
    setSelectedRecipe(null);
    setPendingConflictIngredients(null);
  };

  const activateMode = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
    if (newMode === 'item') {
      showItemFooter();
      if (isSheetOpenRef.current) {
        setTimeout(() => {
          itemInputRef.current?.focus();
        }, 10);
      }
    } else {
      hideItemFooter();
      itemInputRef.current?.blur();
    }
  };

  const handleModeChange = (newMode: AddMode) => {
    activateMode(newMode);
    pagerRef.current?.setPage(ADD_MODE_INDEX[newMode]);
  };

  const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
    const newMode = ADD_MODES[event.nativeEvent.position];
    if (newMode) {
      activateMode(newMode);
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

  const handleCreateRecipe = (initialName?: string) => {
    ref.current?.dismiss();
    router.push(navigation.goToCreateRecipeManual(groceryListId, initialName));
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
          storeName: ingredient.store?.name ?? null,
          storeId: ingredient.store?.id,
        }));

      const result = await addRecipeToList({
        recipeId: selectedRecipe.id,
        listId: groceryListId,
        ingredients: selectedIngredients,
        defaultStore,
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
        defaultStore,
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
        viewClassName="flex-1"
        onOpen={() => {
          isSheetOpenRef.current = true;
          itemInputRef.current?.focus();
        }}
        onDismiss={handleClose}
        scrollable
        footer={
          <View className="pb-safe px-4" collapsable={false}>
            {isItemFooterMounted ? (
              <Animated.View
                key="item-footer"
                className="gap-4"
                style={itemFooterAnimatedStyle}
              >
                <MetaBar />
                <Button
                  variant="default"
                  size="lg"
                  onPress={onSubmit}
                  disabled={!isValid || isSubmitting}
                  status={isItemAdded ? 'success' : 'idle'}
                  successLabel="Item Added"
                  onSuccessComplete={onItemAddedFeedbackComplete}
                >
                  <Text className="text-primary-foreground">
                    {itemSheetMode === 'add' ? 'Add Item' : 'Update Item'}
                  </Text>
                </Button>
              </Animated.View>
            ) : mode === 'recipe' && selectedRecipe ? (
              <Animated.View
                key="recipe-footer"
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
              >
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
              </Animated.View>
            ) : null}
          </View>
        }
      >
        <BottomSheet.Header
          className="px-4"
          title={selectedRecipe ? 'Choose ingredients' : undefined}
          description={selectedRecipe?.name}
          dismissButton={
            selectedRecipe ? <BackButton onPress={handleBackToRecipes} /> : null
          }
          button={
            selectedRecipe ? (
              <ExternalLinkButton
                onPress={() =>
                  ingredientSelectorRef.current?.openRecipeDetails()
                }
              />
            ) : null
          }
        />
        <View className="flex-1">
          {selectedRecipe ? (
            <Animated.View
              key="ingredient-selector"
              className="flex-1"
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <IngredientSelector
                ref={ingredientSelectorRef}
                recipe={selectedRecipe}
                onBack={handleBackToRecipes}
                onDismiss={() => ref.current?.dismiss()}
                listId={groceryListId}
                selectedIds={selectedIngredientIds}
                onToggleIngredient={toggleIngredient}
                onToggleAll={toggleAllIngredients}
                showFooter={false}
                showHeader={false}
              />
            </Animated.View>
          ) : (
            <>
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
                <ModeToggle mode={mode} onModeChange={handleModeChange} />
              </Animated.View>
              <PagerView
                ref={pagerRef}
                style={{ flex: 1 }}
                initialPage={ADD_MODE_INDEX[mode]}
                onPageSelected={handlePageSelected}
              >
                <View key="item" className="flex-1 px-4">
                  <ItemForm />
                </View>
                <View key="recipe" className="flex-1">
                  <RecipeSelector
                    listHeight={Math.max(240, windowHeight - 250)}
                    onSelectRecipe={handleRecipeSelect}
                    onCreateRecipe={handleCreateRecipe}
                  />
                </View>
                <View key="recent" className="flex-1">
                  <FrequentItemsScreen
                    listHeight={Math.max(320, windowHeight - 180)}
                    listId={groceryListId}
                  />
                </View>
              </PagerView>
            </>
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
  const { data: defaultStore } = useDefaultStore();
  const [isItemAdded, setIsItemAdded] = useState(false);

  const onSubmit = async ({
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
    if (!listId) return false;

    try {
      await addGroceryListItem({
        listId,
        item,
        savedItemId: selectedCloudSavedItemId,
        selectedCloudSavedItemStoreId,
        selectedLocalSavedItemId,
      });
      setIsItemAdded(true);
      return true;
    } catch {
      toast.error('Failed to add item');
      return false;
    }
  };

  return (
    <ItemSheetProvider
      listId={groceryListId}
      defaultStore={defaultStore}
      onSubmit={onSubmit}
      mode="add"
    >
      <AddItemSheet
        groceryListId={groceryListId}
        defaultStore={defaultStore}
        isTriggerVisible={isTriggerVisible}
        isItemAdded={isItemAdded}
        onItemAddedFeedbackComplete={() => setIsItemAdded(false)}
      />
    </ItemSheetProvider>
  );
};

export default AddItem;
