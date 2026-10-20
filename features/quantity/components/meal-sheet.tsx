import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Text } from '@/components/ui/text';

import { editMealIngredient, editMealSchedule, removeMeal } from '../meals';
import { formatQuantity, record, records } from '../model';
import type { Meal, Operation, QuantityState } from '../types';

import { AmountSheet } from './amount-sheet';
import { Sheet } from './sheet';
import { useSheetController } from './use-sheet-controller';

const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const validDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.getDate() === Number(date.slice(8, 10))
  );
};

export function ScheduleFields({
  date,
  mealTag,
  servings,
  setDate,
  setMealTag,
  setServings,
}: {
  date: string;
  mealTag: string;
  servings: string;
  setDate: (v: string) => void;
  setMealTag: (v: string) => void;
  setServings: (v: string) => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-sm text-muted-foreground">Date (YYYY-MM-DD)</Text>
      <BottomSheet.TextInput
        accessibilityLabel="Meal date"
        value={date}
        onChangeText={setDate}
      />
      <Text className="text-sm text-muted-foreground">Meal</Text>
      <BottomSheet.TextInput
        accessibilityLabel="Meal type"
        value={mealTag}
        onChangeText={setMealTag}
      />
      <Text className="text-sm text-muted-foreground">Servings multiplier</Text>
      <BottomSheet.TextInput
        accessibilityLabel="Servings multiplier"
        keyboardType="decimal-pad"
        value={servings}
        onChangeText={setServings}
      />
    </View>
  );
}

export function ScheduleSheet({
  name,
  onSchedule,
  onDismiss,
}: {
  name: string;
  onSchedule: (details: Pick<Meal, 'date' | 'mealTag' | 'servings'>) => void;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const [date, setDate] = useState(localDate);
  const [mealTag, setMealTag] = useState('Dinner');
  const [servings, setServings] = useState('1');
  return (
    <Sheet title={`Plan ${name}`} controller={sheet}>
      <ScheduleFields
        {...{ date, mealTag, servings, setDate, setMealTag, setServings }}
      />
      <Button
        disabled={
          !validDate(date) ||
          !Number.isFinite(Number(servings)) ||
          Number(servings) <= 0
        }
        onPress={() =>
          sheet.dismiss(() =>
            onSchedule({ date, mealTag, servings: Number(servings) })
          )
        }
      >
        <Text>Choose shopping quantities</Text>
      </Button>
    </Sheet>
  );
}

export function MealSheet({
  state,
  mealId,
  sourceId,
  newId,
  send,
  onDismiss,
}: {
  state: QuantityState;
  mealId: string;
  sourceId?: string;
  newId: () => string;
  send: (op: Operation) => Promise<void>;
  onDismiss: () => void;
}) {
  const sheet = useSheetController(onDismiss);
  const meal = record(state, mealId, 'meal');
  const [editor, setEditor] = useState<{
    sourceId: string;
    snapshot: QuantityState;
  } | null>(null);
  const [date, setDate] = useState(meal.date);
  const [mealTag, setMealTag] = useState(meal.mealTag);
  const [servings, setServings] = useState(String(meal.servings));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scheduleBaseline] = useState(meal);
  const run = (build: () => Operation, dismiss = false) => {
    setBusy(true);
    return Promise.resolve()
      .then(build)
      .then(send)
      .then(() => {
        setError('');
        if (dismiss) return sheet.dismiss();
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Could not save meal');
      })
      .finally(() => setBusy(false));
  };
  return (
    <Sheet title={meal.name} controller={sheet}>
      <Text className="text-muted-foreground">
        {meal.date} · {meal.mealTag} · {meal.servings}× servings
      </Text>
      {meal.ingredients.map(ingredient => {
        const historical = records(state, 'entry').some(
          e =>
            e.sourceId === ingredient.id &&
            record(state, e.rowId, 'row').status !== 'active'
        );
        return (
          <View
            key={ingredient.id}
            className={`gap-2 rounded-xl p-3 ${sourceId === ingredient.id ? 'bg-muted' : ''}`}
          >
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="text-lg font-medium">{ingredient.name}</Text>
                {ingredient.notes ? (
                  <Text className="text-sm text-muted-foreground">
                    {ingredient.notes}
                  </Text>
                ) : null}
              </View>
              <Switch
                disabled={busy}
                accessibilityLabel={`Include ${ingredient.name} on shopping list`}
                value={ingredient.selected}
                onValueChange={selected => {
                  void run(() =>
                    editMealIngredient(state, newId, mealId, ingredient.id, {
                      selected,
                    })
                  );
                }}
              />
            </View>
            <HapticPressable
              accessibilityRole="button"
              accessibilityLabel={`Adjust planned ${ingredient.name}`}
              className="min-h-12 justify-center"
              onPress={() =>
                setEditor({ sourceId: ingredient.id, snapshot: state })
              }
            >
              <Text className="font-medium">
                {formatQuantity(ingredient.quantity)} {ingredient.unit} · Adjust
                quantity ›
              </Text>
            </HapticPressable>
            {ingredient.overridden ? (
              <Text className="text-sm text-muted-foreground">
                Custom amount · does not scale with servings
              </Text>
            ) : null}
            {historical ? (
              <Text className="text-sm text-muted-foreground">
                This shopping contribution is history. Changes here leave the
                purchased amount unchanged. Schedule a new meal for another
                shop.
              </Text>
            ) : null}
          </View>
        );
      })}
      <ScheduleFields
        {...{ date, mealTag, servings, setDate, setMealTag, setServings }}
      />
      <Button
        variant="outline"
        disabled={
          busy ||
          !validDate(date) ||
          !Number.isFinite(Number(servings)) ||
          Number(servings) <= 0
        }
        onPress={() => {
          void run(() => {
            if (
              meal.date !== scheduleBaseline.date ||
              meal.mealTag !== scheduleBaseline.mealTag ||
              meal.servings !== scheduleBaseline.servings
            )
              throw new Error(
                'The schedule changed while you were editing. Reopen this meal to review it.'
              );
            return editMealSchedule(state, newId, mealId, {
              date,
              mealTag,
              servings: Number(servings),
            });
          }, true);
        }}
      >
        <Text>Save schedule</Text>
      </Button>
      {error ? <Text className="text-destructive">{error}</Text> : null}
      <Button
        variant="ghost"
        onPress={() =>
          Alert.alert(
            'Remove planned meal?',
            'Its active contributions will be removed. Other quantities and purchased history stay.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  void run(() => removeMeal(state, newId, mealId), true);
                },
              },
            ]
          )
        }
      >
        <Text className="text-destructive">Remove from meal plan</Text>
      </Button>
      {editor ? (
        <AmountSheet
          quantity={
            record(editor.snapshot, mealId, 'meal').ingredients.find(
              i => i.id === editor.sourceId
            )?.quantity
          }
          unit={
            meal.ingredients.find(i => i.id === editor.sourceId)?.unit ?? ''
          }
          onSave={quantity =>
            send(
              editMealIngredient(
                editor.snapshot,
                newId,
                mealId,
                editor.sourceId,
                { quantity }
              )
            )
          }
          onDismiss={() => setEditor(null)}
        />
      ) : null}
    </Sheet>
  );
}
