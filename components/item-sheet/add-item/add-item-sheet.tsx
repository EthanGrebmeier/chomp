import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { PlusIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { addGroceryListItem } from '../../../features/grocery-list/instant/add-grocery-list-item';
import { BaseGroceryItem } from '../../../features/grocery-list/types';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { NATIVE_TABS_OFFSET } from '../../../features/shared/consts';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { Button } from '../../ui/button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ItemForm } from '../item-form';
import { MetaBar } from '../meta-bar';
import { ItemSheetProvider, useItemSheet } from '../use-item-sheet';

import { IngredientSelector } from './ingredient-selector';
import { RecipeSelector } from './recipe-selector';

type AddMode = 'item' | 'recipe';

type ModeToggleProps = {
  mode: AddMode;
  onModeChange: (mode: AddMode) => void;
};

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <View className="mb-4 flex-row items-center justify-center gap-2">
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
    </View>
  );
};

type AddItemSheetProps = {
  groceryListId: string;
};

const AddItemSheet = ({ groceryListId }: AddItemSheetProps) => {
  const ref = useRef<TrueSheet>(null);
  const { reset, itemInputRef } = useItemSheet();
  const [mode, setMode] = useState<AddMode>('item');
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);

  const openSheet = () => {
    ref.current?.present();
    if (mode === 'item') {
      itemInputRef.current?.focus();
    }
  };

  const handleClose = () => {
    reset();
    setMode('item');
    setSelectedRecipe(null);
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    setSelectedRecipe(null);
    if (newMode === 'item') {
      itemInputRef.current?.focus();
    }
  };

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
  };

  const handleBackToRecipes = () => {
    setSelectedRecipe(null);
  };

  const handleAddComplete = () => {
    ref.current?.dismiss();
  };

  return (
    <>
      <Button
        size="iconLg"
        style={{ bottom: NATIVE_TABS_OFFSET }}
        onPress={openSheet}
        className="absolute right-6 z-10"
      >
        <Icon
          as={PlusIcon}
          size={28}
          strokeWidth={3}
          className="text-primary-foreground"
        />
      </Button>
      <BottomSheet name="add-item-sheet" ref={ref} onStartClose={handleClose}>
        <View>
          {!selectedRecipe && (
            <ModeToggle mode={mode} onModeChange={handleModeChange} />
          )}
          {mode === 'item' ? (
            <>
              <ItemForm />
              <MetaBar submitLabel="Create" />
            </>
          ) : selectedRecipe ? (
            <IngredientSelector
              recipe={selectedRecipe}
              listId={groceryListId}
              onBack={handleBackToRecipes}
              onComplete={handleAddComplete}
              onDismiss={() => ref.current?.dismiss()}
            />
          ) : (
            <RecipeSelector
              onSelectRecipe={handleRecipeSelect}
              onDismiss={() => ref.current?.dismiss()}
            />
          )}
        </View>
      </BottomSheet>
    </>
  );
};

type AddItemProps = {
  groceryListId: string;
};

const AddItem = ({ groceryListId }: AddItemProps) => {
  const onSubmit = ({
    item,
    listId,
  }: {
    item: BaseGroceryItem;
    listId?: string;
  }) => {
    if (!listId) return;
    addGroceryListItem({
      listId,
      item,
    });
    toast.success(`${item.name} added`);
  };

  return (
    <ItemSheetProvider listId={groceryListId} onSubmit={onSubmit}>
      <AddItemSheet groceryListId={groceryListId} />
    </ItemSheetProvider>
  );
};

export default AddItem;
