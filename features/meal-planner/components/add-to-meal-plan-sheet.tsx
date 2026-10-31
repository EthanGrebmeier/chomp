import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import {
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { sheetCardResize } from '@/components/animated/sheet-motion';
import {
  ComposerHeader,
  ComposerCloseButton,
  ComposerActionSlot,
  COMPOSER_CARD_CLASS,
  COMPOSER_CONTENT_CLASS,
} from '@/components/item-sheet/composer-layout';
import { MetaBarTrailingInsetContext } from '@/components/meta-bar-insets';
import { SHEET_TOP_STYLE, SheetFooter } from '@/components/sheet-content';
import { SheetPage } from '@/components/sheet-page';
import { SheetScreenOverlay } from '@/components/sheet-screen-overlay';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { InlineStoreReviewCard } from '@/features/quantity/app/inline-store-review-card';
import { useInlineStoreReview } from '@/features/quantity/app/use-inline-store-review';
import { useStoreConflictPreview } from '@/features/quantity/app/use-store-conflict-preview';
import { isStoreReviewCancelled } from '@/features/quantity/store-review-cancelled';
import { useDefaultStore } from '@/features/stores/instant/use-default-store';

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
        className="min-h-11 flex-row items-center justify-start gap-2"
      >
        <Text className="text-lg font-medium">
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
  const review = useInlineStoreReview(isSessionOpen);
  const expanded = mode === 'recipe' || !!review.pending;
  const contentOpacity = useSharedValue(1);
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.get(),
  }));

  useEffect(() => {
    if (!isSessionOpen || mode !== 'item' || review.pending) return;
    // Let the native detent and visible input layout commit before focusing.
    const frame = requestAnimationFrame(() => itemInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isSessionOpen, mode, review.pending]);

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
  const { mutate: addRecipeToDate, isPending: isAddingRecipe } =
    useAddRecipeToDate();

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
    if (!selectedRecipe || !recipeDate || isAddingRecipe) return;

    addRecipeToDate(
      {
        listId,
        reviewConflicts: review.review,
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
        onError: error => {
          if (isStoreReviewCancelled(error)) return;
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
    if (!itemName || !selectedDate || isAddingItem) return;

    addItemToDate(
      {
        listId,
        reviewConflicts: review.review,
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
        onError: error => {
          if (isStoreReviewCancelled(error)) return;
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

  const { data: defaultStore } = useDefaultStore();
  const itemConflict = useStoreConflictPreview(
    isSessionOpen ? listId : undefined,
    [{ name: itemName, unit, storeId }],
    defaultStore?.id
  );
  const recipeConflict = useStoreConflictPreview(
    isSessionOpen ? listId : undefined,
    toSnapshotCreateInputs(ingredientRows).filter(item => item.isSelected),
    defaultStore?.id
  );

  const isRecipeAddDisabled = !isRecipeModeValid || isAddingRecipe;

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
      detents={!expanded ? ['auto'] : [expandedHeight / windowHeight]}
      scrollable={expanded}
      draggable={expanded}
      backgroundColor={!expanded ? 'transparent' : backgroundColor}
      cornerRadius={!expanded ? 0 : undefined}
      grabber={expanded}
      elevation={!expanded ? 0 : undefined}
      insetAdjustment="never"
      onWillPresent={() => setIsSessionOpen(true)}
      onWillDismiss={() => {
        review.close();
        setIsSessionOpen(false);
      }}
      onWillFocus={() => {
        if (mode === 'item' && !review.pending) itemInputRef.current?.focus();
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
              expanded
                ? { height: expandedHeight, ...SHEET_TOP_STYLE }
                : { paddingHorizontal: 8, paddingBottom: 24 }
            }
          >
            {!expanded ? (
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
              layout={sheetCardResize}
              className={cn(
                'overflow-hidden bg-background',
                !expanded ? COMPOSER_CARD_CLASS : 'min-h-0 flex-1'
              )}
            >
              <View
                className={expanded ? 'flex-1' : undefined}
                pointerEvents={review.pending ? 'none' : 'auto'}
                accessibilityElementsHidden={!!review.pending}
                importantForAccessibility={
                  review.pending ? 'no-hide-descendants' : 'auto'
                }
              >
                <View
                  collapsable={false}
                  pointerEvents={selectedRecipe ? 'none' : 'auto'}
                  accessibilityElementsHidden={!!selectedRecipe}
                  importantForAccessibility={
                    selectedRecipe ? 'no-hide-descendants' : 'auto'
                  }
                >
                  <ComposerHeader
                    centerContent={
                      <ModeMenu mode={mode} onModeChange={handleModeChange} />
                    }
                    closeAction={
                      <ComposerCloseButton
                        accessibilityLabel="Close meal planner"
                        onPress={() => void sheetRef.current?.dismiss()}
                      />
                    }
                  />
                </View>
                <Animated.View
                  style={[
                    contentAnimatedStyle,
                    { display: mode === 'item' ? 'flex' : 'none' },
                  ]}
                  className={COMPOSER_CONTENT_CLASS}
                >
                  <View>{fields}</View>
                  <View className="mt-1 min-h-11 flex-row items-center gap-2">
                    <View className="min-w-0 flex-1">
                      <MetaBarTrailingInsetContext.Provider value={0}>
                        {metadata}
                      </MetaBarTrailingInsetContext.Provider>
                    </View>
                    <ComposerActionSlot>
                      <Button
                        key={itemConflict.needsReview ? 'review' : 'add'}
                        size={itemConflict.needsReview ? 'default' : 'icon'}
                        className={
                          itemConflict.needsReview
                            ? 'h-10 gap-1 px-3'
                            : 'size-10'
                        }
                        hitSlop={2}
                        accessibilityLabel={
                          itemConflict.needsReview
                            ? itemConflict.label
                            : 'Add item to meal plan'
                        }
                        onPress={handleAddItem}
                        disabled={!isValid() || isAddingItem}
                      >
                        {itemConflict.needsReview ? <Text>Review</Text> : null}
                        <Icon
                          as={
                            itemConflict.needsReview
                              ? ChevronRightIcon
                              : ArrowUpIcon
                          }
                          size={22}
                          strokeWidth={2.5}
                          className="text-primary-foreground"
                        />
                      </Button>
                    </ComposerActionSlot>
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
                      spacing="standard"
                      fillHeight
                      onSelectRecipe={handleSelectRecipe}
                      onCreateRecipe={handleCreateRecipe}
                    />
                  </View>
                </Animated.View>
                {selectedRecipe ? (
                  <SheetScreenOverlay key="ingredient-selector">
                    <SheetPage
                      header={{
                        title: 'Choose ingredients',
                        backAction: (
                          <BackButton onPress={handleBackToRecipes} />
                        ),
                      }}
                    >
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
                      <SheetFooter>
                        <BottomActionButton
                          onPress={handleAddRecipe}
                          disabled={isRecipeAddDisabled}
                        >
                          <Text>
                            {recipeConflict.needsReview
                              ? recipeConflict.label
                              : 'Add to plan'}
                          </Text>
                        </BottomActionButton>
                      </SheetFooter>
                    </SheetPage>
                  </SheetScreenOverlay>
                ) : null}
              </View>
              <InlineStoreReviewCard review={review} />
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
