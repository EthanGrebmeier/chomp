import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ExternalLinkIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { formatQuantity } from '../../../lib/grocery-item';
import { cn } from '../../../lib/utils';
import { RecipeWithIngredients } from '../../recipes/types';
import { useAddItemToDate } from '../hooks/useAddItemToMealPlan';
import { useAddRecipeToDate } from '../hooks/useAddRecipeToMealPlan';

import { DatePillSheet } from './date-pill-sheet';
import {
  MealPlanItemProvider,
  useMealPlanItem,
} from './meal-plan-item-context';
import { MealPlanItemForm } from './meal-plan-item-form';
import { MealTimeSheet } from './meal-time-sheet';

type AddMode = 'item' | 'recipe';

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

// Component that uses the context for item mode
const AddItemMode = ({ onSuccess }: { onSuccess: () => void }) => {
  const {
    itemName,
    quantity,
    unit,
    category,
    storeId,
    selectedDate,
    mealTag,
    itemNotes,
    resetState,
  } = useMealPlanItem();

  const { mutate: addItemToDate } = useAddItemToDate();

  const handleAddItem = () => {
    if (!itemName || !selectedDate) return;

    addItemToDate(
      {
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
          toast.success(`${itemName} added to meal plan`);
          resetState();
          onSuccess();
        },
        onError: () => {
          toast.error('Failed to add item');
        },
      }
    );
  };

  return (
    <View className="flex-1 px-4">
      <MealPlanItemForm onSubmit={handleAddItem} />
    </View>
  );
};

type AddToMealPlanSheetProps = {
  ref?: React.RefObject<AddToMealPlanSheetRef | null>;
};

export type AddToMealPlanSheetRef = {
  present: (options?: { defaultDate?: string }) => void;
  dismiss: () => void;
};

export const AddToMealPlanSheet = ({ ref }: AddToMealPlanSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);

  const [mode, setMode] = useState<AddMode>('recipe');
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  const [recipeDate, setRecipeDate] = useState<string | undefined>(undefined);
  const [recipeMealTag, setRecipeMealTag] = useState<string | undefined>(
    undefined
  );

  const { mutate: addRecipeToDate } = useAddRecipeToDate();

  // Expose methods via ref
  if (ref) {
    ref.current = {
      present: (options?: { defaultDate?: string }) => {
        if (options?.defaultDate) {
          setDefaultDate(options.defaultDate);
          setRecipeDate(options.defaultDate);
        }
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    };
  }

  const resetState = () => {
    setMode('recipe');
    setSelectedRecipe(null);
    setRecipeDate(undefined);
    setRecipeMealTag(undefined);
    setDefaultDate(undefined);
  };

  const handleSelectRecipe = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setRecipeMealTag(recipe.mealTag ?? undefined);
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
  };

  const handleAddRecipe = () => {
    if (!selectedRecipe || !recipeDate) return;

    addRecipeToDate(
      {
        recipeId: selectedRecipe.id,
        date: recipeDate,
        mealTag: recipeMealTag,
        servings: 1,
      },
      {
        onSuccess: () => {
          toast.success(`${selectedRecipe.name} added to meal plan`);
          resetState();
          sheetRef.current?.dismiss();
        },
        onError: () => {
          toast.error('Failed to add recipe');
        },
      }
    );
  };

  const handleGoToRecipe = () => {
    if (!selectedRecipe) return;
    sheetRef.current?.dismiss();
    router.push(`/recipes/${selectedRecipe.id}`);
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
  };

  const handleItemSuccess = () => {
    sheetRef.current?.dismiss();
  };

  const isRecipeModeValid = selectedRecipe && recipeDate;

  return (
    <BottomSheet
      name="add-to-meal-plan-sheet"
      ref={sheetRef}
      detents={
        mode === 'item'
          ? ['auto']
          : mode === 'recipe' && !selectedRecipe
            ? [0.7]
            : ['auto']
      }
      scrollable={mode === 'recipe' && !selectedRecipe}
      onStartClose={() => {
        KeyboardController.dismiss();
        resetState();
      }}
    >
      {!selectedRecipe && (
        <ModeToggle mode={mode} onModeChange={handleModeChange} />
      )}

      {mode === 'recipe' ? (
        selectedRecipe ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="px-4"
          >
            <BottomSheet.Header
              title={selectedRecipe.name}
              dismissButton={<BackButton onPress={handleBackToRecipes} />}
              button={
                <Button
                  variant="secondary"
                  onPress={handleGoToRecipe}
                  size="icon"
                >
                  <Icon
                    as={ExternalLinkIcon}
                    size={20}
                    className="text-secondary-foreground"
                  />
                </Button>
              }
            />
            <View className="gap-4">
              <View>
                <Text className="text-lg font-medium text-foreground">
                  Ingredients
                </Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="max-h-32"
                >
                  {selectedRecipe.recipe_ingredients.map(ingredient => (
                    <View
                      key={ingredient.id}
                      className="flex-row items-center justify-between"
                    >
                      <Text className="text-base font-medium text-foreground">
                        {ingredient.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {formatQuantity({
                          quantity: ingredient.quantity,
                          unit: ingredient.unit,
                        })}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <ScrollingMetaBar
                action={
                  <Button
                    onPress={handleAddRecipe}
                    disabled={!isRecipeModeValid}
                  >
                    <Text>Add to Plan</Text>
                  </Button>
                }
              >
                <DatePillSheet date={recipeDate} onSelect={setRecipeDate} />
                <MealTimeSheet
                  mealTime={recipeMealTag}
                  onSelect={setRecipeMealTag}
                />
              </ScrollingMetaBar>
            </View>
          </Animated.View>
        ) : (
          <RecipeSelector
            onSelectRecipe={handleSelectRecipe}
            onDismiss={() => sheetRef.current?.dismiss()}
          />
        )
      ) : (
        <MealPlanItemProvider initialValues={{ selectedDate: defaultDate }}>
          <AddItemMode onSuccess={handleItemSuccess} />
        </MealPlanItemProvider>
      )}
    </BottomSheet>
  );
};
