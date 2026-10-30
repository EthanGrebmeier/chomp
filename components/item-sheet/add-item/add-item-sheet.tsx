import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import {
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { toast } from 'sonner-native';

import { sheetCardResize } from '@/components/animated/sheet-motion';
import {
  SHEET_TOP_STYLE,
  SHEET_CARD_STYLE,
  SheetFooter,
} from '@/components/sheet-content';
import { SheetHeader } from '@/components/sheet-header';
import { SheetScreenOverlay } from '@/components/sheet-screen-overlay';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { CloseButton } from '@/components/ui/close-button';
import { InlineStoreReviewCard } from '@/features/quantity/app/inline-store-review-card';
import { useInlineStoreReview } from '@/features/quantity/app/use-inline-store-review';
import { useStoreConflictPreview } from '@/features/quantity/app/use-store-conflict-preview';
import { isStoreReviewCancelled } from '@/features/quantity/store-review-cancelled';

import { FrequentItemsScreen } from '../../../features/frequent-items/components/frequent-items-screen';
import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { addRecipeToList } from '../../../features/recipes/instant/add-recipe-to-list';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { addSavedItemIfNotExists } from '../../../features/saved-items/instant/add-saved-item-if-not-exists';
import { upsertLocalSavedItem } from '../../../features/saved-items/local/upsert-local-saved-item';
import { useDefaultStore } from '../../../features/stores/instant/use-default-store';
import { navigation } from '../../../lib/navigation';
import { THEME } from '../../../lib/theme';
import { cn } from '../../../lib/utils';
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

type AddItemSheetProps = {
  review: ReturnType<typeof useInlineStoreReview>;
  isSessionOpen: boolean;
  setIsSessionOpen: (open: boolean) => void;
  itemOnly?: boolean;
  groceryListId: string;
  defaultStore?: { id: string; name: string } | null;
  isTriggerVisible?: boolean;
  isItemAdded: boolean;
  onItemAddedFeedbackComplete: () => void;
};

const AddItemSheet = ({
  review,
  isSessionOpen,
  setIsSessionOpen,
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
  const ref = useRef<TrueSheet>(null);
  const [hasBrowsed, setHasBrowsed] = useState(false);
  const {
    reset,
    itemInputRef,
    onSubmit,
    isValid,
    isSubmitting,
    itemInputValue,
    unit,
    storeId,
  } = useItemSheet();
  const [mode, setMode] = useState<AddMode>('item');
  const expanded = mode !== 'item' || !!review.pending;
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<
    Set<string>
  >(new Set());
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const itemConflict = useStoreConflictPreview(
    isSessionOpen ? groceryListId : undefined,
    [{ name: itemInputValue, unit, storeId }]
  );
  const recipeConflict = useStoreConflictPreview(
    isSessionOpen ? groceryListId : undefined,
    selectedRecipe?.recipe_ingredients.filter(item =>
      selectedIngredientIds.has(item.id)
    ) ?? [],
    defaultStore?.id
  );

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
    review.close();
    setIsSessionOpen(false);
    Keyboard.dismiss();
    itemInputRef.current?.blur();
    reset();
    onItemAddedFeedbackComplete();
    setMode('item');
    setHasBrowsed(false);
    setSelectedRecipe(null);
  };

  useEffect(() => {
    if (!isSessionOpen || mode !== 'item' || review.pending) return;
    // Focus during presentation, or after the detent updates when returning
    // from browsing, so the keyboard moves alongside the sheet.
    const focus = requestAnimationFrame(() => itemInputRef.current?.focus());
    return () => cancelAnimationFrame(focus);
  }, [isSessionOpen, mode, itemInputRef, review.pending]);

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
        reviewConflicts: review.review,
        defaultStore,
      });

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${selectedRecipe.name}`
      );
      handleAddComplete();
    } catch (error) {
      if (isStoreReviewCancelled(error)) return;
      toast.error('Failed to add ingredients');
    } finally {
      setIsAddingRecipe(false);
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
        onDidDismiss={handleClose}
      >
        <ItemForm
          compact
          renderContent={(fields, suggestions) => (
            <View
              className={!expanded ? 'px-2' : undefined}
              style={
                !expanded
                  ? { paddingBottom: 24 }
                  : {
                      height: expandedHeight,
                      ...SHEET_TOP_STYLE,
                    }
              }
            >
              {!expanded ? (
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
                layout={sheetCardResize}
                style={!expanded ? SHEET_CARD_STYLE : undefined}
                className={cn(
                  'overflow-hidden bg-background',
                  !expanded
                    ? 'rounded-[32px] border border-border'
                    : 'min-h-0 flex-1'
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
                  <SheetHeader
                    title={itemOnly ? 'Add item' : undefined}
                    centerContent={
                      itemOnly ? undefined : (
                        <ModeMenu mode={mode} onModeChange={handleModeChange} />
                      )
                    }
                    backAction={
                      <CloseButton
                        accessibilityLabel="Close add item"
                        onPress={() => void ref.current?.dismiss()}
                      />
                    }
                    primaryAction={
                      mode === 'item' ? <SavedItemActions /> : undefined
                    }
                  />
                  <Animated.View
                    style={[
                      contentAnimatedStyle,
                      { display: mode === 'item' ? 'flex' : 'none' },
                    ]}
                    className="px-8"
                  >
                    <View>{fields}</View>
                    <View className="-mx-8 mt-1 min-h-11 justify-center overflow-hidden px-8">
                      <MetaBar
                        trailingInset={itemConflict.needsReview ? 144 : 92}
                        savedItemActionsInHeader
                      />
                      <View className="absolute bottom-0 right-8 top-0 justify-center bg-background pl-2">
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
                          key={itemConflict.needsReview ? 'review' : 'add'}
                          size={itemConflict.needsReview ? 'default' : 'icon'}
                          className={
                            itemConflict.needsReview
                              ? 'h-10 gap-1 px-3'
                              : 'size-10'
                          }
                          hitSlop={2}
                          accessibilityLabel={
                            isItemAdded
                              ? 'Item added'
                              : itemConflict.needsReview
                                ? itemConflict.label
                                : 'Add item'
                          }
                          onPress={onSubmit}
                          disabled={!groceryListId || !isValid || isSubmitting}
                          status={isItemAdded ? 'success' : 'idle'}
                          successLabel=""
                          onSuccessComplete={onItemAddedFeedbackComplete}
                        >
                          {itemConflict.needsReview ? (
                            <Text>Review</Text>
                          ) : null}
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
                      </View>
                    </View>
                  </Animated.View>
                  {hasBrowsed ? (
                    <Animated.View
                      className="min-h-0 flex-1"
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
                        <FrequentItemsScreen
                          listId={groceryListId}
                          reviewConflicts={review.review}
                        />
                      </View>
                    </Animated.View>
                  ) : null}
                  {selectedRecipe ? (
                    <SheetScreenOverlay key="ingredient-selector">
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
                      <SheetFooter>
                        <BottomActionButton
                          onPress={handleAddRecipeToList}
                          disabled={
                            selectedIngredientIds.size === 0 || isAddingRecipe
                          }
                        >
                          <Text className="text-primary-foreground">
                            {recipeConflict.needsReview
                              ? recipeConflict.label
                              : 'Add to List'}
                          </Text>
                        </BottomActionButton>
                      </SheetFooter>
                    </SheetScreenOverlay>
                  ) : null}
                </View>
                <InlineStoreReviewCard review={review} />
              </Animated.View>
            </View>
          )}
        />
      </TrueSheet>
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
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const review = useInlineStoreReview(isSessionOpen);

  const onSubmit = async ({
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
      await addGroceryListItem({
        listId,
        item,
        savedItemId: saveItem ? selectedCloudSavedItemId : undefined,
        selectedCloudSavedItemStoreId,
        persistLocalSavedItem: false,
        reviewConflicts: review.review,
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
    } catch (error) {
      if (isStoreReviewCancelled(error)) return false;
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
        review={review}
        isSessionOpen={isSessionOpen}
        setIsSessionOpen={setIsSessionOpen}
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
