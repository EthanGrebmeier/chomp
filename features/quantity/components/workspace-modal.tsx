import { id } from '@instantdb/react-native';
import type { Dispatch, SetStateAction } from 'react';

import { saveRecipe, scheduleMeal } from '../meals';
import { record, totalFor } from '../model';
import { manualAdd, moveRow, type Destination } from '../shopping';
import type {
  Ingredient,
  Meal,
  Operation,
  QuantityState,
  Recipe,
} from '../types';

import { DestinationSheet } from './destination-sheet';
import { AddItemSheet } from './ingredient-form';
import { ItemSheet } from './item-sheet';
import { MealSheet, ScheduleSheet } from './meal-sheet';
import { RecipeSheet } from './recipe-sheet';

export type Modal =
  | { kind: 'row'; id: string }
  | { kind: 'meal'; id: string; sourceId?: string }
  | { kind: 'add'; planned?: boolean }
  | { kind: 'recipe'; recipe?: Recipe; snapshot: QuantityState }
  | {
      kind: 'schedule';
      recipeId: string | null;
      name: string;
      ingredients: Ingredient[];
      snapshot: QuantityState;
    }
  | {
      kind: 'destination';
      ingredients: Ingredient[];
      listId: string;
      snapshot: QuantityState;
      build: (choices: Record<string, Destination>) => Operation;
    };

export function WorkspaceModal({
  modal,
  setModal,
  state,
  listId,
  send: run,
  destinations,
  onOpenMeal,
}: {
  modal: Modal | null;
  setModal: Dispatch<SetStateAction<Modal | null>>;
  state: QuantityState;
  listId?: string;
  send: (op: Operation) => Promise<void>;
  destinations: (
    ingredients: Ingredient[],
    listId: string,
    build: (choices: Record<string, Destination>) => Operation,
    snapshot?: QuantityState
  ) => void;
  onOpenMeal: () => void;
}) {
  const schedule = (details: Pick<Meal, 'date' | 'mealTag' | 'servings'>) => {
    if (modal?.kind !== 'schedule' || !listId) return;
    const { name, recipeId, ingredients, snapshot } = modal;
    destinations(
      ingredients.map(i => ({ ...i, quantity: i.quantity * details.servings })),
      listId,
      choices =>
        scheduleMeal(
          snapshot,
          id,
          { ...details, name, recipeId, listId },
          ingredients,
          choices
        ),
      snapshot
    );
  };
  return (
    <>
      {modal?.kind === 'row' && state.documents[modal.id] ? (
        <ItemSheet
          key={modal.id}
          state={state}
          rowId={modal.id}
          newId={id}
          send={run}
          onDismiss={() => setModal(null)}
          onOpenMeal={(mealId, sourceId) => {
            onOpenMeal();
            setModal({ kind: 'meal', id: mealId, sourceId });
          }}
          onMove={(rowId, destinationList) => {
            const row = record(state, rowId, 'row');
            const ingredient = {
              ...row,
              quantity: totalFor(state, rowId) ?? 0,
            };
            destinations([ingredient], destinationList, choices =>
              moveRow(state, id, rowId, destinationList, choices[rowId])
            );
          }}
        />
      ) : null}
      {modal?.kind === 'meal' && state.documents[modal.id] ? (
        <MealSheet
          key={modal.id}
          state={state}
          mealId={modal.id}
          sourceId={modal.sourceId}
          newId={id}
          send={run}
          onDismiss={() => setModal(null)}
        />
      ) : null}
      {modal?.kind === 'add' ? (
        <AddItemSheet
          newId={id}
          planned={modal.planned}
          onDismiss={() => setModal(null)}
          onAdd={item => {
            if (modal.planned)
              setModal({
                kind: 'schedule',
                recipeId: null,
                name: item.name,
                ingredients: [item],
                snapshot: state,
              });
            else if (listId)
              destinations([item], listId, choices =>
                manualAdd(state, id, listId, item, choices[item.id])
              );
          }}
        />
      ) : null}
      {modal?.kind === 'recipe' ? (
        <RecipeSheet
          recipe={modal.recipe}
          newId={id}
          onDismiss={() => setModal(null)}
          onSave={async recipe => {
            await run(saveRecipe(modal.snapshot, id, recipe));
          }}
        />
      ) : null}
      {modal?.kind === 'schedule' ? (
        <ScheduleSheet
          name={modal.name}
          onDismiss={() => setModal(null)}
          onSchedule={schedule}
        />
      ) : null}
      {modal?.kind === 'destination' ? (
        <DestinationSheet
          state={modal.snapshot}
          listId={modal.listId}
          ingredients={modal.ingredients}
          onDismiss={() => setModal(null)}
          onConfirm={async choices => {
            await run(modal.build(choices));
          }}
        />
      ) : null}
    </>
  );
}
