import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ArrowUpIcon, ChevronDownIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import {
  slideInRight,
  slideOutRight,
} from '../../../components/animated/transitions';
import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { ItemSuggestions } from '../../../components/item-sheet/item-suggestions';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItemTitle,
} from '../../../components/native-dropdown';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { navigation } from '../../../lib/navigation';
import { THEME } from '../../../lib/theme';
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
import { MealScheduleSentence } from './meal-schedule-sentence';

// Match the grocery add sheet: keep the card continuous as its detent changes.
const CARD_RESIZE = LinearTransition.duration(300)
  .easing(Easing.bezier(0.32, 0.72, 0, 1))
  .reduceMotion(ReduceMotion.System);

type AddMode = 'recipe' | 'item';

const ModeMenu = ({
  mode,
  onModeChange,
}: {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
}) => (
  <DropdownMenuRoot>
    <DropdownMenuTrigger>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel="Change meal-plan entry type"
        className="min-h-11 flex-row items-center justify-center gap-2"
      >
        <Text className="text-lg font-semibold">
          {mode === 'item' ? 'Plan item' : 'Plan recipe'}
        </Text>
        <Icon
          as={ChevronDownIcon}
          size={16}
          className="text-muted-foreground"
        />
      </View>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {(['item', 'recipe'] as const).map(value => (
        <DropdownMenuCheckboxItem
          key={value}
          value={mode === value ? 'on' : 'off'}
          onValueChange={() => onModeChange(value)}
        >
          <DropdownMenuItemTitle>
            {value === 'item' ? 'Plan item' : 'Plan recipe'}
          </DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenuRoot>
);

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
  const reduceMotion = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const backgroundColor =
    THEME[colorScheme === 'dark' ? 'dark' : 'light'].background;
  const expandedHeight = Math.min(
    windowHeight * 0.94,
    windowHeight - insets.top - 12
  );
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
    itemNotes,
    resetState: resetMealPlanItemState,
    isValid,
  } = useMealPlanItem();

  const [mode, setMode] = useState<AddMode>('recipe');
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const contentOpacity = useSharedValue(1);
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.get(),
  }));

  useEffect(() => {
    if (!isSessionOpen || mode !== 'item') return;
    // Let the native detent and visible input layout commit before focusing.
    const frame = requestAnimationFrame(() => itemInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isSessionOpen, mode]);

  useEffect(() => {
    contentOpacity.set(
      withTiming(1, {
        duration: 150,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [mode, contentOpacity]);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [ingredientRows, setIngredientRows] = useState<
    MealPlanIngredientEditorRow[]
  >([]);
  const [recipeDate, setRecipeDate] = useState<string | undefined>(undefined);
  const [recipeMealTag, setRecipeMealTag] = useState<string | undefined>(
    undefined
  );
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
    setSelectedRecipe(null);
    setIngredientRows([]);
    setRecipeDate(undefined);
    setRecipeMealTag(undefined);
  };

  const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
    Keyboard.dismiss();
    setSelectedRecipe(recipe);
    setRecipeMealTag(recipe.mealTag ?? undefined);
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
        sourceIngredients: selectedRecipe.recipe_ingredients,
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

  const handleModeChange = (newMode: AddMode) => {
    if (newMode === mode) return;
    Keyboard.dismiss();
    setSelectedRecipe(null);
    contentOpacity.set(0);
    setMode(newMode);
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
          resetMealPlanItemState({
            itemNameInputRef: itemInputRef,
            keepMealContext: true,
          });
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

  const metadata = (
    <MealPlanMetaBar
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
  );

  return (
    <TrueSheet
      name="add-to-meal-plan-sheet"
      ref={sheetRef}
      detents={mode === 'item' ? ['auto'] : [expandedHeight / windowHeight]}
      scrollable={mode === 'recipe'}
      draggable={mode === 'recipe'}
      backgroundColor={mode === 'item' ? 'transparent' : backgroundColor}
      cornerRadius={mode === 'item' ? 0 : undefined}
      grabber={mode === 'recipe'}
      elevation={mode === 'item' ? 0 : undefined}
      insetAdjustment="never"
      onWillPresent={() => setIsSessionOpen(true)}
      onWillDismiss={() => setIsSessionOpen(false)}
      onWillFocus={() => {
        if (mode === 'item') itemInputRef.current?.focus();
      }}
      onDidDismiss={() => {
        Keyboard.dismiss();
        resetMealPlanItemState();
        resetSheetState();
      }}
    >
      <MealPlanItemForm
        compact
        onSubmit={handleAddItem}
        showMetaBar={false}
        inputRef={itemInputRef}
        keepKeyboardOnSubmit
        renderContent={(fields, suggestions) => (
          <View
            style={
              mode === 'recipe'
                ? { height: expandedHeight, paddingTop: 24 }
                : { paddingHorizontal: 8, paddingBottom: 24 }
            }
          >
            {mode === 'item' ? (
              <ItemSuggestions
                onClose={() => void sheetRef.current?.dismiss()}
                label="Close meal planner"
              >
                {suggestions}
              </ItemSuggestions>
            ) : null}
            <Animated.View
              collapsable={false}
              collapsableChildren={false}
              layout={CARD_RESIZE}
              className={cn(
                'overflow-hidden bg-background',
                mode === 'item'
                  ? 'rounded-[32px] border border-border pb-2.5 pt-1.5'
                  : 'min-h-0 flex-1'
              )}
            >
              <View
                collapsable={false}
                className="min-h-11 items-center justify-center px-4"
                pointerEvents={selectedRecipe ? 'none' : 'auto'}
                accessibilityElementsHidden={!!selectedRecipe}
                importantForAccessibility={
                  selectedRecipe ? 'no-hide-descendants' : 'auto'
                }
              >
                <ModeMenu mode={mode} onModeChange={handleModeChange} />
              </View>
              <Animated.View
                style={[
                  contentAnimatedStyle,
                  { display: mode === 'item' ? 'flex' : 'none' },
                ]}
                className="px-3"
              >
                <View className="pl-1">{fields}</View>
                <View className="mt-1 min-h-11 flex-row items-center gap-2">
                  <View className="min-w-0 flex-1">{metadata}</View>
                  <Button
                    size="icon"
                    className="size-10"
                    hitSlop={2}
                    accessibilityLabel="Add item to meal plan"
                    onPress={handleAddItem}
                    disabled={!isValid() || isAddingItem}
                  >
                    <Icon
                      as={ArrowUpIcon}
                      size={22}
                      strokeWidth={2.5}
                      className="text-primary-foreground"
                    />
                  </Button>
                </View>
              </Animated.View>
              <Animated.View
                className="min-h-0 flex-1 overflow-hidden"
                style={[
                  contentAnimatedStyle,
                  { display: mode === 'recipe' ? 'flex' : 'none' },
                ]}
              >
                <View
                  className="min-h-0 flex-1"
                  pointerEvents={selectedRecipe ? 'none' : 'auto'}
                  accessibilityElementsHidden={!!selectedRecipe}
                  importantForAccessibility={
                    selectedRecipe ? 'no-hide-descendants' : 'auto'
                  }
                >
                  <RecipeSelector
                    fillHeight
                    onSelectRecipe={handleSelectRecipe}
                    onCreateRecipe={handleCreateRecipe}
                  />
                </View>
              </Animated.View>
              {selectedRecipe ? (
                <Animated.View
                  key="ingredient-selector"
                  className="overflow-hidden bg-background"
                  style={StyleSheet.absoluteFill}
                  entering={reduceMotion ? undefined : slideInRight()}
                  exiting={reduceMotion ? undefined : slideOutRight()}
                >
                  <BottomSheet.Header
                    className="px-4"
                    title="Choose ingredients"
                    dismissButton={<BackButton onPress={handleBackToRecipes} />}
                  />
                  <IngredientSelector
                    recipe={selectedRecipe}
                    mode="meal-plan"
                    listId={listId}
                    bottomContentInset={24}
                    mealPlanIngredients={mealPlanIngredients}
                    onBack={handleBackToRecipes}
                    onDismiss={() => sheetRef.current?.dismiss()}
                    onToggleIngredient={handleToggleIngredient}
                    onToggleAll={handleToggleAllIngredients}
                    selectedIds={selectedIngredientIds}
                    onEditIngredient={handleEditIngredient}
                    showHeader={false}
                    showFooter={false}
                    recipeNameHeading
                    scheduleControl={
                      <MealScheduleSentence
                        date={recipeDate}
                        onDateChange={setRecipeDate}
                        mealTag={recipeMealTag}
                        onMealTagChange={setRecipeMealTag}
                      />
                    }
                  />
                  <View className="px-4 pb-6 pt-2">
                    <Button
                      onPress={handleAddRecipe}
                      disabled={isRecipeAddDisabled}
                    >
                      <Text>Add to plan</Text>
                    </Button>
                  </View>
                </Animated.View>
              ) : null}
            </Animated.View>
          </View>
        )}
      />
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
    </TrueSheet>
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
