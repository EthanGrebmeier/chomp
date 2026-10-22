import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ArrowUpIcon, ChevronDownIcon, PlusIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
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
import { addSavedItemIfNotExists } from '../../../features/saved-items/instant/add-saved-item-if-not-exists';
import { upsertLocalSavedItem } from '../../../features/saved-items/local/upsert-local-saved-item';
import { useDefaultStore } from '../../../features/stores/instant/use-default-store';
import { navigation } from '../../../lib/navigation';
import { THEME } from '../../../lib/theme';
import { cn } from '../../../lib/utils';
import { slideInRight, slideOutRight } from '../../animated/transitions';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItemTitle,
} from '../../native-dropdown';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ItemForm } from '../item-form';
import { ItemSuggestions } from '../item-suggestions';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import { IngredientSelector } from './ingredient-selector';
import { RecipeSelector } from './recipe-selector';
import { SavedItemActions } from './saved-item-actions';

// The native detent animates the sheet's position; this keeps its visible card
// continuous while the transparent suggestion space and content bounds change.
const CARD_RESIZE = LinearTransition.duration(300)
  .easing(Easing.bezier(0.32, 0.72, 0, 1))
  .reduceMotion(ReduceMotion.System);

const ADD_MODES = [
  { value: 'item', label: 'Add Item' },
  { value: 'recipe', label: 'Add Recipe' },
  { value: 'recent', label: 'Recent Items' },
] as const;

type AddMode = (typeof ADD_MODES)[number]['value'];

type ModeToggleProps = {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
};

const ModeMenu = ({ mode, onModeChange }: ModeToggleProps) => (
  <DropdownMenuRoot>
    <DropdownMenuTrigger>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${ADD_MODES.find(option => option.value === mode)?.label}. Change item type`}
        className="min-h-11 min-w-11 flex-row items-center justify-center gap-2"
      >
        <Text className="text-lg font-semibold">
          {ADD_MODES.find(option => option.value === mode)?.label}
        </Text>
        <Icon
          as={ChevronDownIcon}
          size={16}
          className="text-muted-foreground"
        />
      </View>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {ADD_MODES.map(option => (
        <DropdownMenuCheckboxItem
          key={option.value}
          value={option.value === mode ? 'on' : 'off'}
          onValueChange={() => onModeChange(option.value)}
        >
          <DropdownMenuItemTitle>{option.label}</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenuRoot>
);

const ModeHeader = (props: ModeToggleProps) => (
  // Preserve a native header container so its menu moves in the card's local
  // coordinates instead of being flattened into the sheet's layout.
  <View
    collapsable={false}
    className={cn('items-center', props.mode === 'item' ? 'px-24' : 'px-14')}
  >
    <ModeMenu {...props} />
    {props.mode === 'item' ? (
      <View className="absolute right-2 top-0">
        <SavedItemActions />
      </View>
    ) : null}
  </View>
);

type AddItemSheetProps = {
  itemOnly?: boolean;
  groceryListId: string;
  defaultStore?: { id: string; name: string } | null;
  isTriggerVisible?: boolean;
  isItemAdded: boolean;
  onItemAddedFeedbackComplete: () => void;
};

const AddItemSheet = ({
  itemOnly = false,
  groceryListId,
  defaultStore,
  isTriggerVisible = true,
  isItemAdded,
  onItemAddedFeedbackComplete,
}: AddItemSheetProps) => {
  const { colorScheme } = useColorScheme();
  const backgroundColor =
    THEME[colorScheme === 'dark' ? 'dark' : 'light'].background;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // TrueSheet's native flex container uses the entire screen height. Bound
  // our card to the same height as its detent instead of inheriting that frame.
  const expandedHeight = Math.min(
    windowHeight * 0.94,
    windowHeight - insets.top - 12
  );
  const contentOpacity = useSharedValue(1);
  const triggerOpacity = useSharedValue(isTriggerVisible ? 1 : 0);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const ref = useRef<TrueSheet>(null);
  const [hasBrowsed, setHasBrowsed] = useState(false);
  const { reset, itemInputRef, onSubmit, isValid, isSubmitting } =
    useItemSheet();
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
    triggerOpacity.set(
      withTiming(isTriggerVisible ? 1 : 0, {
        duration: 200,
      })
    );
  }, [isTriggerVisible, triggerOpacity]);

  const triggerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: triggerOpacity.get(),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.get(),
  }));

  const openSheet = () => {
    if (!groceryListId) {
      toast.error('Grocery list unavailable. Please try again.');
      return;
    }

    reset();
    void ref.current?.present();
  };

  const handleClose = () => {
    setIsSessionOpen(false);
    Keyboard.dismiss();
    itemInputRef.current?.blur();
    reset();
    onItemAddedFeedbackComplete();
    setMode('item');
    setHasBrowsed(false);
    setSelectedRecipe(null);
    setPendingConflictIngredients(null);
  };

  useEffect(() => {
    if (!isSessionOpen || mode !== 'item') return;
    // Focus during presentation, or after the detent updates when returning
    // from browsing, so the keyboard moves alongside the sheet.
    const focus = requestAnimationFrame(() => itemInputRef.current?.focus());
    return () => cancelAnimationFrame(focus);
  }, [isSessionOpen, mode, itemInputRef]);

  const handleModeChange = (newMode: AddMode) => {
    if (newMode === mode) return;
    Keyboard.dismiss();
    setSelectedRecipe(null);
    if (newMode !== 'item') setHasBrowsed(true);
    // Keep the shell and title mounted; only the incoming body fades in.
    contentOpacity.set(0);
    setMode(newMode);
  };

  useEffect(() => {
    contentOpacity.set(
      withTiming(1, {
        duration: 150,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [mode, contentOpacity]);

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    Keyboard.dismiss();
    setSelectedRecipe(recipe);
    setSelectedIngredientIds(
      new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
    );
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
    setSelectedIngredientIds(new Set());
  };

  const handleOpenRecipe = async () => {
    if (!selectedRecipe) return;

    const recipeId = selectedRecipe.id;
    await ref.current?.dismiss();
    router.push(navigation.goToRecipe(recipeId, groceryListId));
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
      <TrueSheet
        ref={ref}
        name="add-item-sheet"
        detents={mode === 'item' ? ['auto'] : [expandedHeight / windowHeight]}
        scrollable={mode !== 'item'}
        draggable={mode !== 'item'}
        backgroundColor={mode === 'item' ? 'transparent' : backgroundColor}
        cornerRadius={mode === 'item' ? 0 : undefined}
        grabber={mode !== 'item'}
        elevation={mode === 'item' ? 0 : undefined}
        insetAdjustment="never"
        onWillPresent={() => setIsSessionOpen(true)}
        onWillFocus={() => {
          if (mode === 'item') itemInputRef.current?.focus();
        }}
        onDidDismiss={handleClose}
      >
        <ItemForm
          compact
          renderContent={(fields, suggestions) => (
            <View
              className={mode === 'item' ? 'px-2' : undefined}
              style={
                mode === 'item'
                  ? { paddingBottom: 24 }
                  : {
                      height: expandedHeight,
                      paddingTop: 24,
                    }
              }
            >
              {mode === 'item' ? (
                <ItemSuggestions
                  onClose={() => void ref.current?.dismiss()}
                  label="Close add item"
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
                {itemOnly ? (
                  <Text className="py-3 text-center text-lg font-semibold">
                    Add item
                  </Text>
                ) : (
                  <ModeHeader mode={mode} onModeChange={handleModeChange} />
                )}
                <Animated.View
                  style={[
                    contentAnimatedStyle,
                    { display: mode === 'item' ? 'flex' : 'none' },
                  ]}
                  className="px-3"
                >
                  <View className="pl-1">{fields}</View>
                  <View className="mt-1 min-h-11 justify-center overflow-hidden">
                    <MetaBar trailingInset={92} savedItemActionsInHeader />
                    <View className="absolute bottom-0 right-0 top-0 justify-center bg-background pl-2">
                      <Svg
                        pointerEvents="none"
                        width={24}
                        height="100%"
                        style={{ position: 'absolute', left: -24, top: 0 }}
                      >
                        <Defs>
                          <LinearGradient
                            id="add-item-metabar-fade"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <Stop
                              offset="0%"
                              stopColor={backgroundColor}
                              stopOpacity={0}
                            />
                            <Stop offset="100%" stopColor={backgroundColor} />
                          </LinearGradient>
                        </Defs>
                        <Rect
                          width="100%"
                          height="100%"
                          fill="url(#add-item-metabar-fade)"
                        />
                      </Svg>
                      <Button
                        size="icon"
                        className="size-10"
                        hitSlop={2}
                        accessibilityLabel={
                          isItemAdded ? 'Item added' : 'Add item'
                        }
                        onPress={onSubmit}
                        disabled={!groceryListId || !isValid || isSubmitting}
                        status={isItemAdded ? 'success' : 'idle'}
                        successLabel=""
                        onSuccessComplete={onItemAddedFeedbackComplete}
                      >
                        <Icon
                          as={ArrowUpIcon}
                          size={22}
                          strokeWidth={2.5}
                          className="text-primary-foreground"
                        />
                      </Button>
                    </View>
                  </View>
                </Animated.View>
                {hasBrowsed ? (
                  <Animated.View
                    className="min-h-0 flex-1 pt-3"
                    style={[
                      contentAnimatedStyle,
                      { display: mode === 'item' ? 'none' : 'flex' },
                    ]}
                  >
                    <View
                      className="flex-1"
                      style={{ display: mode === 'recipe' ? 'flex' : 'none' }}
                    >
                      <RecipeSelector
                        fillHeight
                        onSelectRecipe={handleRecipeSelect}
                        onCreateRecipe={handleCreateRecipe}
                      />
                    </View>
                    <View
                      className="flex-1"
                      style={{ display: mode === 'recent' ? 'flex' : 'none' }}
                    >
                      <FrequentItemsScreen listId={groceryListId} />
                    </View>
                  </Animated.View>
                ) : null}
                {selectedRecipe ? (
                  <Animated.View
                    key="ingredient-selector"
                    className="overflow-hidden bg-background pt-4"
                    style={StyleSheet.absoluteFill}
                    entering={slideInRight()}
                    exiting={slideOutRight()}
                  >
                    <IngredientSelector
                      recipe={selectedRecipe}
                      onBack={handleBackToRecipes}
                      onOpenRecipe={() => void handleOpenRecipe()}
                      onDismiss={() => void ref.current?.dismiss()}
                      listId={groceryListId}
                      selectedIds={selectedIngredientIds}
                      onToggleIngredient={toggleIngredient}
                      onToggleAll={toggleAllIngredients}
                      showFooter={false}
                      showHeader
                    />
                    <View
                      className="shrink-0 px-4 pt-2"
                      style={{
                        paddingBottom: Math.max(12, insets.bottom),
                      }}
                    >
                      <Button
                        size="lg"
                        className="min-h-11"
                        onPress={handleAddRecipeToList}
                        disabled={
                          selectedIngredientIds.size === 0 ||
                          isAddingRecipe ||
                          isResolvingConflict
                        }
                      >
                        <Text className="text-primary-foreground">
                          Add to List
                        </Text>
                      </Button>
                    </View>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </View>
          )}
        />
      </TrueSheet>
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
  /** Undefined uses saved/default stores; null explicitly focuses No store. */
  focusedStore?: { id: string; name: string } | null;
  groceryListId: string;
  isTriggerVisible?: boolean;
};

const AddItem = ({
  groceryListId,
  isTriggerVisible = true,
  focusedStore,
}: AddItemProps) => {
  const { data: userDefaultStore } = useDefaultStore();
  const defaultStore =
    focusedStore !== undefined ? focusedStore : userDefaultStore;
  const [isItemAdded, setIsItemAdded] = useState(false);

  const onSubmit = ({
    item,
    listId,
    selectedCloudSavedItemId,
    selectedCloudSavedItemStoreId,
    selectedLocalSavedItemId,
    saveItem,
  }: {
    item: BaseGroceryItem;
    listId?: string;
    selectedCloudSavedItemId?: string;
    selectedCloudSavedItemStoreId?: string;
    selectedLocalSavedItemId?: string;
    saveItem?: boolean;
  }) => {
    if (!listId) {
      toast.error('Grocery list unavailable. Please try again.');
      return false;
    }

    try {
      // Saved-item persistence is driven solely by the toggle and only runs
      // here, on Add. When on, a linked cloud item is synced (and linked)
      // inside addGroceryListItem; local/new items are handled below. When
      // off, nothing is written to saved items.
      const transactionPromise = addGroceryListItem({
        listId,
        item,
        savedItemId: saveItem ? selectedCloudSavedItemId : undefined,
        selectedCloudSavedItemStoreId,
        persistLocalSavedItem: false,
      });
      void transactionPromise.catch(() => {
        toast.error('Failed to add item');
      });

      if (saveItem && !selectedCloudSavedItemId) {
        if (selectedLocalSavedItemId) {
          // Sync edits back to the linked local saved item (defaults are
          // promoted to an owned copy by upsertLocalSavedItem).
          void upsertLocalSavedItem({
            item: {
              name: item.name,
              category: item.category,
              notes: item.notes,
              storeId: item.storeId,
            },
            selectedLocalSavedItemId,
          }).catch(() => {
            toast.error('Item added, but changes could not be synced');
          });
        } else {
          // Save a brand new item to the user's cloud saved items.
          void addSavedItemIfNotExists({
            name: item.name,
            category: item.category,
            notes: item.notes,
            storeId: item.storeId,
          }).catch(() => {
            toast.error('Item added, but could not be saved to your items');
          });
        }
      }
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
      preferDefaultStore={focusedStore !== undefined}
    >
      <AddItemSheet
        groceryListId={groceryListId}
        itemOnly={focusedStore !== undefined}
        defaultStore={defaultStore}
        isTriggerVisible={isTriggerVisible}
        isItemAdded={isItemAdded}
        onItemAddedFeedbackComplete={() => setIsItemAdded(false)}
      />
    </ItemSheetProvider>
  );
};

export default AddItem;
