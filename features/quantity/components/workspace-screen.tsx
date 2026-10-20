import { id } from '@instantdb/react-native';
import { router } from 'expo-router';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { addRecipe } from '../meals';
import { records } from '../model';
import { resetExample } from '../reset-example';
import type { Destination } from '../shopping';
import { QuantityTransaction } from '../transaction';
import type { Ingredient, Operation, QuantityState } from '../types';
import {
  useQuantityWorkspace,
  useQuantityWorkspaces,
} from '../use-quantity-workspace';

import { ConflictCard } from './conflict-card';
import { MealPlanPanel } from './meal-plan-panel';
import { RecipesPanel } from './recipes-panel';
import { ShoppingPanel } from './shopping-panel';
import { WorkspaceModal, type Modal } from './workspace-modal';

export function QuantityWorkspaceScreen() {
  const workspaces = useQuantityWorkspaces();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedId = chosenId ?? workspaces.data?.gqc_workspaces_v1[0]?.id;
  if (selectedId && workspaces.user)
    return (
      <Workspace
        key={`${workspaces.user.id}:${selectedId}`}
        workspaceId={selectedId}
        userId={workspaces.user.id}
      />
    );
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-5 px-8">
        <Text className="text-3xl font-semibold">Quantity workspace</Text>
        <Text className="text-muted-foreground">
          A persistent test workspace for the new quantity model. Start with the
          Apples example, then add your own recipes, meals and shopping items.
        </Text>
        {workspaces.isLoading ? (
          <ActivityIndicator />
        ) : (
          <Button
            disabled={busy || !workspaces.user}
            onPress={() => {
              setBusy(true);
              void workspaces
                .create()
                .then(setChosenId)
                .catch(() =>
                  setError(
                    'Could not create the workspace. Check the development database setup and connection.'
                  )
                )
                .finally(() => setBusy(false));
            }}
          >
            <Text>{busy ? 'Creating…' : 'Create test workspace'}</Text>
          </Button>
        )}
        {!workspaces.user ? (
          <Text>Sign in or continue as a guest in Chomp first.</Text>
        ) : null}
        {error || workspaces.error ? (
          <Text className="text-destructive">
            {error || workspaces.error?.message}
          </Text>
        ) : null}
        <Button variant="ghost" onPress={() => router.back()}>
          <Text>Back</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function Workspace({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  const workspace = useQuantityWorkspace(workspaceId, userId);
  const { state, send, canEdit } = workspace;
  const [tab, setTab] = useState<'shopping' | 'meals' | 'recipes'>('shopping');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [error, setError] = useState('');
  const lists = records(state, 'list');
  const listId =
    lists.find(list => list.id === selectedList)?.id ?? lists[0]?.id;
  const recipes = records(state, 'recipe');
  const run = async (op: Operation) => {
    await send(op);
    setError('');
  };
  const act = (action: () => Operation) => {
    try {
      void run(action()).catch(e => setError(String(e)));
    } catch (e) {
      setError(String(e));
    }
  };
  const destinations = (
    ingredients: Ingredient[],
    targetListId: string,
    build: (choices: Record<string, Destination>) => Operation,
    snapshot: QuantityState = state
  ) =>
    setModal({
      kind: 'destination',
      ingredients,
      listId: targetListId,
      snapshot,
      build,
    });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          accessibilityLabel="Back"
          onPress={() => router.back()}
        >
          <Icon as={ChevronLeft} />
        </Button>
        <View className="flex-1">
          <Text className="text-2xl font-semibold">Quantity workspace</Text>
          <Text className="text-xs text-muted-foreground">
            Saved test data ·{' '}
            {workspace.connection === 'authenticated'
              ? workspace.pending.length
                ? 'Syncing changes…'
                : 'Connected'
              : 'Offline · changes saved on device'}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canEdit}
          accessibilityLabel="Reset test example"
          onPress={() =>
            Alert.alert(
              'Start a fresh example?',
              'This replaces the current test groceries, recipes and meals with the original Apples example.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset example',
                  onPress: () => act(() => resetExample(state, id)),
                },
              ]
            )
          }
        >
          <Icon as={RotateCcw} size={20} />
        </Button>
      </View>
      <View className="flex-row gap-2 px-6 pb-3">
        {(['shopping', 'meals', 'recipes'] as const).map(value => (
          <Button
            key={`${value}:${value === tab}`}
            className="flex-1"
            variant={tab === value ? 'default' : 'ghost'}
            onPress={() => setTab(value)}
          >
            <Text>
              {value === 'shopping'
                ? 'Groceries'
                : value === 'meals'
                  ? 'Meal plan'
                  : 'Recipes'}
            </Text>
          </Button>
        ))}
      </View>
      {tab !== 'recipes' ? (
        <View className="flex-row gap-2 px-6 pb-3">
          {lists.map(list => (
            <Button
              key={`${list.id}:${listId === list.id}`}
              variant={listId === list.id ? 'secondary' : 'ghost'}
              onPress={() => setSelectedList(list.id)}
            >
              <Text>{list.name}</Text>
            </Button>
          ))}
        </View>
      ) : null}
      {workspace.loading ? <ActivityIndicator className="mt-6" /> : null}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 100,
          gap: 16,
        }}
      >
        {workspace.error || error ? (
          <View className="gap-2 rounded-xl bg-muted p-4">
            <Text accessibilityRole="alert" className="text-destructive">
              {workspace.error ?? error}
            </Text>
            <Button
              variant="outline"
              onPress={() => {
                void workspace.retry();
              }}
            >
              <Text>Retry connection</Text>
            </Button>
          </View>
        ) : null}
        {state.conflicts.map(conflict => (
          <ConflictCard
            key={conflict.operation.id}
            conflict={conflict}
            state={state}
            disabled={!canEdit}
            onKeepCurrent={() =>
              act(() =>
                new QuantityTransaction(state).build(
                  id(),
                  'Keep current result',
                  [conflict.operation.id]
                )
              )
            }
          />
        ))}
        {workspace.pending
          .filter(p => p.error)
          .map(p => (
            <View
              key={p.operation.id}
              className="gap-2 rounded-xl bg-muted p-4"
            >
              <Text className="font-semibold">{p.operation.label}</Text>
              <Text className="text-destructive">{p.error}</Text>
              <Button
                variant="outline"
                onPress={() => {
                  void workspace.retry();
                }}
              >
                <Text>Retry saved change</Text>
              </Button>
            </View>
          ))}
        {tab === 'shopping' ? (
          <ShoppingPanel
            {...{ state, listId, canEdit, act }}
            onAdd={() => setModal({ kind: 'add' })}
            onOpen={id => setModal({ kind: 'row', id })}
          />
        ) : null}
        {tab === 'meals' ? (
          <MealPlanPanel
            {...{ state, listId, canEdit }}
            onAdd={() => setModal({ kind: 'add', planned: true })}
            onOpen={id => setModal({ kind: 'meal', id })}
          />
        ) : null}
        {tab === 'recipes' ? (
          <RecipesPanel
            {...{ recipes, listId, canEdit }}
            onNew={() => setModal({ kind: 'recipe', snapshot: state })}
            onEdit={recipe =>
              setModal({ kind: 'recipe', recipe, snapshot: state })
            }
            onAdd={recipe => {
              if (listId)
                destinations(recipe.ingredients, listId, choices =>
                  addRecipe(state, id, recipe.id, listId, choices)
                );
            }}
            onPlan={recipe =>
              setModal({
                kind: 'schedule',
                recipeId: recipe.id,
                name: recipe.name,
                ingredients: recipe.ingredients,
                snapshot: state,
              })
            }
          />
        ) : null}
      </ScrollView>
      <WorkspaceModal
        {...{ modal, setModal, state, listId, destinations }}
        send={run}
        onOpenMeal={() => setTab('meals')}
      />
    </SafeAreaView>
  );
}
