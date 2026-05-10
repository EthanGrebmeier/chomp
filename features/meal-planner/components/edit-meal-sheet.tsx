import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format, parseISO, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { RecipeSelector } from '../../../components/item-sheet/add-item/recipe-selector';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { navigation } from '../../../lib/navigation';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { Recipe, RecipeWithIngredients } from '../../recipes/types';
import { useRemoveRecipeFromMealPlan } from '../hooks/useRemoveRecipeFromMealPlan';
import { useUpdateMealPlanRecipe } from '../hooks/useUpdateMealPlanRecipe';
import { MealPlanRecipe } from '../types';

import { MealSheetRecipeDropdown } from './meal-sheet-recipe-dropdown';
import { MealTimeSheet } from './meal-time-sheet';

type EditMealSheetProps = {};

export type EditMealSheetRef = {
  open: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
};

export const EditMealSheet = forwardRef<EditMealSheetRef, EditMealSheetProps>(
  (_props, ref) => {
    const [mealTag, setMealTag] = useState<string | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(
      undefined
    );
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [mealPlanRecipeToEdit, setMealPlanRecipeToEdit] =
      useState<MealPlanRecipe | null>(null);

    const sheetRef = useRef<TrueSheet>(null);
    const changeRecipeSheetRef = useRef<TrueSheet>(null);
    const calendarSheetRef = useRef<CalendarSheetRef>(null);
    const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
    const { mutate: removeRecipeFromMealPlan } = useRemoveRecipeFromMealPlan();
    const lastSyncedSnapshotRef = useRef<string | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getSnapshot = useCallback(
      (recipeId: string | null, mealTagValue?: string, dateValue?: string) =>
        JSON.stringify({
          recipeId,
          mealTag: mealTagValue ?? null,
          date: dateValue ?? null,
        }),
      []
    );

    const persistChanges = useCallback(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;

      const snapshot = getSnapshot(selectedRecipe.id, mealTag, selectedDate);
      if (snapshot === lastSyncedSnapshotRef.current) return;

      updateMealPlanRecipe(
        {
          mealPlanRecipeId: mealPlanRecipeToEdit.id,
          updates: {
            recipeId: selectedRecipe.id,
            mealTag,
            servings: 1,
            date: selectedDate,
          },
        },
        {
          onSuccess: () => {
            lastSyncedSnapshotRef.current = snapshot;
          },
          onError: () => {
            toast.error('Failed to update meal');
          },
        }
      );
    }, [
      getSnapshot,
      mealPlanRecipeToEdit,
      mealTag,
      selectedDate,
      selectedRecipe,
      updateMealPlanRecipe,
    ]);

    useImperativeHandle(ref, () => ({
      open: ({
        mealPlanRecipe,
        recipe,
      }: {
        mealPlanRecipe: MealPlanRecipe;
        recipe: Recipe;
      }) => {
        setSelectedDate(mealPlanRecipe.date);
        setSelectedRecipe(recipe);
        setMealPlanRecipeToEdit(mealPlanRecipe);
        setMealTag(mealPlanRecipe.mealTag ?? undefined);
        lastSyncedSnapshotRef.current = getSnapshot(
          recipe.id,
          mealPlanRecipe.mealTag ?? undefined,
          mealPlanRecipe.date
        );
        changeRecipeSheetRef.current?.dismiss();
        sheetRef.current?.present();
      },
    }));

    const resetState = () => {
      setSelectedRecipe(null);
      setSelectedDate(undefined);
      setMealTag(undefined);
      setMealPlanRecipeToEdit(null);
      lastSyncedSnapshotRef.current = null;
      changeRecipeSheetRef.current?.dismiss();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };

    const handleRemoveMeal = () => {
      if (!mealPlanRecipeToEdit) return;

      removeRecipeFromMealPlan({
        mealPlanRecipeId: mealPlanRecipeToEdit.id,
      });

      resetState();
      sheetRef.current?.dismiss();
    };

    const handleRecipeChange = (recipe: RecipeWithIngredients) => {
      setSelectedRecipe(recipe);
      changeRecipeSheetRef.current?.dismiss();
    };

    const scheduleAutoSave = useCallback(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        persistChanges();
      }, 350);
    }, [mealPlanRecipeToEdit, persistChanges, selectedRecipe]);

    const flushAutoSave = useCallback(() => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      persistChanges();
    }, [persistChanges]);

    useEffect(() => {
      if (!mealPlanRecipeToEdit || !selectedRecipe) return;
      scheduleAutoSave();
    }, [mealPlanRecipeToEdit, scheduleAutoSave, selectedRecipe]);

    const footerContent = mealPlanRecipeToEdit ? (
      <View className="px-4 pb-safe">
        <MetaBarLayout>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => calendarSheetRef.current?.present()}>
              <Pill
                hasValue={!!selectedDate}
                icon={<Icon as={CalendarIcon} size={16} />}
              >
                {selectedDate
                  ? startOfDay(parseISO(selectedDate + 'T00:00:00')).toLocaleDateString()
                  : 'Select Date'}
              </Pill>
            </Pressable>
            <MealTimeSheet onSelect={setMealTag} mealTime={mealTag} />
          </View>
        </MetaBarLayout>
      </View>
    ) : undefined;

    return (
      <>
        <BottomSheet
          name="edit-meal-sheet"
          ref={sheetRef}
          onStartClose={() => {
            KeyboardController.dismiss();
            flushAutoSave();
          }}
          onDismiss={resetState}
          footer={footerContent}
        >
          <BottomSheet.SheetView className="pb-safe">
            <CalendarSheet
              name="edit-meal-calendar-sheet"
              ref={calendarSheetRef}
              headerTitle="Select Date"
              selectedDate={
                selectedDate
                  ? startOfDay(parseISO(selectedDate + 'T00:00:00'))
                  : undefined
              }
              onChange={date => {
                setSelectedDate(format(date, 'yyyy-MM-dd'));
              }}
            />
            <View className="pb-28">
              <View className="gap-2">
                {selectedRecipe && (
                  <View className="w-full flex-row items-center justify-between gap-2">
                    <RecipeCardContent
                      name={selectedRecipe.name}
                      className="flex-1"
                    />
                    <MealSheetRecipeDropdown
                      recipeId={selectedRecipe.id}
                      recipeName={selectedRecipe.name}
                      onRemove={handleRemoveMeal}
                      onViewRecipe={() => {
                        router.push(navigation.goToRecipe(selectedRecipe.id));
                        sheetRef.current?.dismiss();
                        calendarSheetRef.current?.dismiss();
                        changeRecipeSheetRef.current?.dismiss();
                      }}
                      onChangeRecipe={() => {
                        changeRecipeSheetRef.current?.present();
                      }}
                    />
                  </View>
                )}
              </View>
            </View>
          </BottomSheet.SheetView>
        </BottomSheet>

        <BottomSheet
          name="edit-meal-change-recipe-sheet"
          ref={changeRecipeSheetRef}
          detents={[0.9]}
          scrollable
          viewClassName="flex-1"
          onStartClose={() => {
            KeyboardController.dismiss();
          }}
        >
          <View className="flex-1 pb-safe">
            <View className="flex-1 gap-2">
              <RecipeSelector
                onSelectRecipe={handleRecipeChange}
                onDismiss={() => changeRecipeSheetRef.current?.dismiss()}
              />
            </View>
          </View>
        </BottomSheet>
      </>
    );
  }
);

EditMealSheet.displayName = 'EditMealSheet';
