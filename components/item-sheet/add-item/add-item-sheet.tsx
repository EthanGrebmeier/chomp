import { SheetDetent, TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { PlusIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { addRecipeToList } from '../../../features/recipes/instant/add-recipe-to-list';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { NATIVE_TABS_OFFSET } from '../../../features/shared/consts';
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
};

const AddItemSheet = ({ groceryListId }: AddItemSheetProps) => {
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

  const detents = useMemo<SheetDetent[]>(() => {
    if (mode === 'item') {
      return ['auto'];
    }
    return [1];
  }, [mode]);

  const isDarkMode = useColorScheme() === 'dark';

  const openSheet = () => {
    ref.current?.present();
  };

  const handleClose = () => {
    reset();
    setMode('item');
    setSelectedRecipe(null);
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
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
  };

  const handleAddComplete = () => {
    ref.current?.dismiss();
  };

  useEffect(() => {
    if (selectedRecipe) {
      setSelectedIngredientIds(
        new Set(
          selectedRecipe.recipe_ingredients.map(ingredient => ingredient.id)
        )
      );
      return;
    }
    setSelectedIngredientIds(new Set());
  }, [selectedRecipe]);

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

      await addRecipeToList({
        recipeId: selectedRecipe.id,
        listId: groceryListId,
        ingredients: selectedIngredients,
      });

      toast.success(
        `Added ${selectedIngredients.length} item${selectedIngredients.length === 1 ? '' : 's'} from ${selectedRecipe.name}`
      );
      handleAddComplete();
    } catch {
      toast.error('Failed to add ingredients');
    } finally {
      setIsAddingRecipe(false);
    }
  };

  return (
    <>
      <Button
        size="iconLg"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={openSheet}
        className="absolute right-6 z-10"
      >
        <Icon
          as={PlusIcon}
          size={28}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
      <BottomSheet
        detents={detents}
        name="add-item-sheet"
        ref={ref}
        onOpen={() => {
          itemInputRef.current?.focus();
        }}
        onStartClose={handleClose}
        scrollable={mode !== 'item'}
        viewClassName="pb-safe"
        footer={
          <>
            {mode === 'item' ? (
              <View className=" px-10 pb-4">
                <View>
                  <Button
                    variant="default"
                    size="default"
                    onPress={onSubmit}
                    disabled={!isValid}
                  >
                    <Text className="text-primary-foreground">
                      {itemSheetMode === 'add' ? 'Add Item' : 'Update Item'}
                    </Text>
                  </Button>
                </View>
              </View>
            ) : mode === 'recipe' && selectedRecipe ? (
              <View className="px-10 pb-4">
                <Button
                  variant="default"
                  size="default"
                  onPress={handleAddRecipeToList}
                  disabled={selectedIngredientIds.size === 0 || isAddingRecipe}
                >
                  <Text className="text-primary-foreground">Add to List</Text>
                </Button>
              </View>
            ) : undefined}
            <LinearGradient
              colors={
                isDarkMode
                  ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']
                  : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']
              }
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              pointerEvents="none"
              style={styles.footerGradient}
            />
          </>
        }
      >
        {!selectedRecipe && (
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        )}
        {mode === 'item' ? (
          <View className="px-4">
            <ItemForm />
            <MetaBar />
          </View>
        ) : (
          <View>
            {selectedRecipe ? (
              <Animated.View
                key="ingredient-selector"
                entering={FadeIn.duration(300)}
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
      </BottomSheet>
    </>
  );
};

type AddItemProps = {
  groceryListId: string;
};

const AddItem = ({ groceryListId }: AddItemProps) => {
  const onSubmit = ({
    item,
    listId,
  }: {
    item: BaseGroceryItem;
    listId?: string;
  }) => {
    if (!listId) return;
    addGroceryListItem({
      listId,
      item,
    });
    toast.success(`${item.name} added`);
  };

  return (
    <ItemSheetProvider listId={groceryListId} onSubmit={onSubmit} mode="add">
      <AddItemSheet groceryListId={groceryListId} />
    </ItemSheetProvider>
  );
};

const styles = StyleSheet.create({
  footerGradient: {
    position: 'absolute',
    bottom: -80,
    left: 0,
    right: 0,
    height: 160,
  },
});

export default AddItem;
