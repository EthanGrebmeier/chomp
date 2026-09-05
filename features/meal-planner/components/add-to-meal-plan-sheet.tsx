import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
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

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddItemToDate } from '../hooks/useAddItemToMealPlan';
import { useAddRecipeToDate } from '../hooks/useAddRecipeToMealPlan';
import {
  MealPlanIngredientEditorRow,
  applyMealPlanIngredientOverride,
  getSelectedSourceIngredientIds,
  initializeMealPlanIngredientEditor,
  toSnapshotCreateInputs,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';

import { DatePillSheet } from './date-pill-sheet';
import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import {
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemForm } from './meal-plan-item-form';
import { MealPlanMetaBar } from './meal-plan-meta-bar';
import { MealTimeSheet } from './meal-time-sheet';

const ADD_MODES = ['recipe', 'item'] as const;
const FOOTER_FADE_DURATION = 200;

type AddMode = (typeof ADD_MODES)[number];

const ADD_MODE_INDEX: Record<AddMode, number> = {
  recipe: 0,
  item: 1,
};

const useFadingPresence = (initiallyVisible = false) => {
  const opacity = useSharedValue(initiallyVisible ? 1 : 0);
  const [isMounted, setIsMounted] = useState(initiallyVisible);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
  }));

  const unmount = () => {
    setIsMounted(false);
  };

  const show = () => {
    setIsMounted(true);
    opacity.set(withTiming(1, { duration: FOOTER_FADE_DURATION }));
  };

  const hide = () => {
    opacity.set(
      withTiming(0, { duration: FOOTER_FADE_DURATION }, finished => {
        if (finished) {
          scheduleOnRN(unmount);
        }
      })
    );
  };

  const reset = (visible: boolean) => {
    setIsMounted(visible);
    opacity.set(visible ? 1 : 0);
  };

  return { animatedStyle, hide, isMounted, reset, show };
};

type ModeToggleProps = {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
};

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-2">
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
    </View>
  );
};

type AddToMealPlanSheetProps = {
  listId: string;
  ref?: React.RefObject<AddToMealPlanSheetRef | null>;
};

export type AddToMealPlanSheetRef = {
  present: (options?: { defaultDate?: string }) => void;
  dismiss: () => void;
};

const AddToMealPlanSheetInner = ({ listId, ref }: AddToMealPlanSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const itemInputRef = useRef<TextInput>(null);
  const {
    itemName,
    hasItemTitle,
    quantity,
    unit,
    category,
    storeId,
    selectedDate,
    setQuantity,
    setUnit,
    setCategory,
    setStoreId,
    setSelectedDate,
    mealTag,
    setMealTag,
    itemNotes,
    resetState: resetMealPlanItemState,
    isValid,
  } = useMealPlanItem();

  const [mode, setMode] = useState<AddMode>('recipe');
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [ingredientRows, setIngredientRows] = useState<
    MealPlanIngredientEditorRow[]
  >([]);
  const [recipeDate, setRecipeDate] = useState<string | undefined>(undefined);
  const [recipeMealTag, setRecipeMealTag] = useState<string | undefined>(
    undefined
  );
  const {
    animatedStyle: itemFooterAnimatedStyle,
    hide: hideItemFooter,
    isMounted: isItemFooterMounted,
    reset: resetItemFooter,
    show: showItemFooter,
  } = useFadingPresence();
  const {
    animatedStyle: recipeFooterAnimatedStyle,
    hide: hideRecipeFooter,
    isMounted: isRecipeFooterMounted,
    reset: resetRecipeFooter,
    show: showRecipeFooter,
  } = useFadingPresence();
  const ingredientOverrideSheetRef =
    useRef<MealPlanIngredientOverrideSheetRef>(null);

  const { mutate: addItemToDate, isPending: isAddingItem } = useAddItemToDate();
  const { mutate: addRecipeToDate } = useAddRecipeToDate();

  useImperativeHandle(
    ref,
    () => ({
      present: (options?: { defaultDate?: string }) => {
        if (options?.defaultDate) {
          setRecipeDate(options.defaultDate);
          setSelectedDate(options.defaultDate);
        }
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [setSelectedDate]
  );

  const resetSheetState = () => {
    setMode('recipe');
    pagerRef.current?.setPageWithoutAnimation(ADD_MODE_INDEX.recipe);
    setSelectedRecipe(null);
    setIngredientRows([]);
    setRecipeDate(undefined);
    setRecipeMealTag(undefined);
    resetItemFooter(false);
    resetRecipeFooter(false);
  };

  const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setRecipeMealTag(recipe.mealTag ?? undefined);
    showRecipeFooter();
    setIngredientRows(
      initializeMealPlanIngredientEditor(recipe.recipe_ingredients)
    );
  };

  const handleCreateRecipe = (initialName?: string) => {
    sheetRef.current?.dismiss();
    router.dismissTo(navigation.goToCreateRecipeManual(listId, initialName));
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setIngredientRows([]);
    hideRecipeFooter();
  };

  const handleAddRecipe = () => {
    if (!selectedRecipe || !recipeDate || selectedIngredientIds.size === 0)
      return;

    addRecipeToDate(
      {
        listId,
        recipeId: selectedRecipe.id,
        date: recipeDate,
        mealTag: recipeMealTag,
        servings: 1,
        ingredientSnapshots: toSnapshotCreateInputs(ingredientRows),
      },
      {
        onSuccess: () => {
          resetSheetState();
          sheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add recipe');
        },
      }
    );
  };

  const activateMode = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
    if (newMode === 'item') {
      hideRecipeFooter();
      showItemFooter();
      setTimeout(() => {
        itemInputRef.current?.focus();
      }, 10);
    } else {
      hideItemFooter();
      hideRecipeFooter();
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

  const handleAddItem = () => {
    if (!itemName || !selectedDate) return;

    addItemToDate(
      {
        listId,
        name: itemName,
        quantity,
        unit,
        category,
        storeId,
        date: selectedDate,
        mealTag,
        notes: itemNotes || undefined,
      },
      {
        onSuccess: () => {
          // Keep the sheet open for continuous entry. Clear the name field in
          // place (no remount) so it keeps focus and the keyboard stays up.
          resetMealPlanItemState({ itemNameInputRef: itemInputRef });
          itemInputRef.current?.focus();
        },
        onError: () => {
          toast.error('Failed to add item');
        },
      }
    );
  };

  const isRecipeModeValid = selectedRecipe && recipeDate;
  const selectedIngredientIds = getSelectedSourceIngredientIds(ingredientRows);
  const mealPlanIngredients = (() => {
    if (!selectedRecipe) return [];

    const ingredientRowsBySourceId = new Map(
      ingredientRows.map(row => [row.sourceRecipeIngredientId, row])
    );

    return selectedRecipe.recipe_ingredients.map(ingredient => {
      const row = ingredientRowsBySourceId.get(ingredient.id);
      if (!row) {
        return {
          ...ingredient,
          sourceRecipeIngredientId: ingredient.id,
        };
      }

      return {
        ...ingredient,
        sourceRecipeIngredientId: row.sourceRecipeIngredientId,
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        notes: row.notes ?? undefined,
        category: row.category ?? undefined,
      };
    });
  })();

  const handleToggleIngredient = (sourceRecipeIngredientId: string) => {
    setIngredientRows(prev =>
      toggleMealPlanIngredientSelection(prev, sourceRecipeIngredientId)
    );
  };

  const handleToggleAllIngredients = () => {
    setIngredientRows(prev => toggleAllMealPlanIngredientSelection(prev));
  };

  const handleEditIngredient = (sourceRecipeIngredientId: string) => {
    const row = ingredientRows.find(
      ingredientRow =>
        ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
    );
    if (!row) return;
    ingredientOverrideSheetRef.current?.present(row);
  };

  const isRecipeAddDisabled =
    !isRecipeModeValid || selectedIngredientIds.size === 0;

  const footer = (
    <View className="pb-safe px-4" collapsable={false}>
      {isRecipeFooterMounted ? (
        <Animated.View className="gap-4" style={recipeFooterAnimatedStyle}>
          <ScrollingMetaBar>
            <DatePillSheet date={recipeDate} onSelect={setRecipeDate} />
            <MealTimeSheet
              mealTime={recipeMealTag}
              onSelect={setRecipeMealTag}
            />
          </ScrollingMetaBar>
          <Button
            size="lg"
            onPress={handleAddRecipe}
            disabled={isRecipeAddDisabled}
          >
            <Text>Add to Plan</Text>
          </Button>
        </Animated.View>
      ) : isItemFooterMounted ? (
        <Animated.View className="gap-4" style={itemFooterAnimatedStyle}>
          <MealPlanMetaBar
            date={selectedDate}
            onDateChange={setSelectedDate}
            mealTag={mealTag}
            onMealTagChange={setMealTag}
            quantity={quantity}
            onQuantityChange={setQuantity}
            unit={unit}
            onUnitChange={setUnit}
            category={category}
            onCategoryChange={setCategory}
            storeId={storeId}
            onStoreIdChange={setStoreId}
            onSubmit={handleAddItem}
            isValid={isValid()}
            showAction={false}
            optionsDisabled={!hasItemTitle}
          />
          <Button
            variant="default"
            size="lg"
            onPress={handleAddItem}
            disabled={!isValid() || isAddingItem}
          >
            <Text className="text-primary-foreground">Add Item</Text>
          </Button>
        </Animated.View>
      ) : null}
    </View>
  );

  return (
    <BottomSheet
      name="add-to-meal-plan-sheet"
      ref={sheetRef}
      detents={[1]}
      scrollable
      viewClassName="flex-1"
      onStartClose={() => {
        KeyboardController.dismiss();
        resetMealPlanItemState();
        resetSheetState();
      }}
      footer={footer}
    >
      <BottomSheet.Header
        className="px-4"
        title={selectedRecipe ? 'Choose ingredients' : undefined}
        description={selectedRecipe?.name}
        dismissButton={
          selectedRecipe ? (
            <BackButton onPress={handleBackToRecipes} />
          ) : undefined
        }
      />
      <View className="min-h-0 flex-1">
        {selectedRecipe ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="min-h-0 flex-1"
          >
            <IngredientSelector
              recipe={selectedRecipe}
              mode="meal-plan"
              listId={listId}
              bottomContentInset={180}
              mealPlanIngredients={mealPlanIngredients}
              onBack={handleBackToRecipes}
              onDismiss={() => sheetRef.current?.dismiss()}
              onToggleIngredient={handleToggleIngredient}
              onToggleAll={handleToggleAllIngredients}
              selectedIds={selectedIngredientIds}
              onEditIngredient={handleEditIngredient}
              showHeader={false}
            />
          </Animated.View>
        ) : (
          <>
            <ModeToggle mode={mode} onModeChange={handleModeChange} />
            <PagerView
              ref={pagerRef}
              style={{ flex: 1 }}
              initialPage={ADD_MODE_INDEX.recipe}
              onPageSelected={handlePageSelected}
            >
              <View key="recipe" className="min-h-0 flex-1">
                <RecipeSelector
                  fillHeight
                  onSelectRecipe={handleSelectRecipe}
                  onCreateRecipe={handleCreateRecipe}
                />
              </View>
              <View key="item" className="flex-1 px-4">
                <MealPlanItemForm
                  onSubmit={handleAddItem}
                  showMetaBar={false}
                  inputRef={itemInputRef}
                  keepKeyboardOnSubmit
                />
              </View>
            </PagerView>
          </>
        )}
      </View>
      <MealPlanIngredientOverrideSheet
        ref={ingredientOverrideSheetRef}
        onSave={async ({ sourceRecipeIngredientId, updates }) => {
          setIngredientRows(prev =>
            prev.map(row =>
              row.sourceRecipeIngredientId === sourceRecipeIngredientId
                ? applyMealPlanIngredientOverride({ row, updates })
                : row
            )
          );
        }}
      />
    </BottomSheet>
  );
};

export const AddToMealPlanSheet = ({
  listId,
  ref,
}: AddToMealPlanSheetProps) => {
  return (
    <MealPlanItemProvider initialValues={{ selectedDate: undefined }}>
      <AddToMealPlanSheetInner listId={listId} ref={ref} />
    </MealPlanItemProvider>
  );
};
