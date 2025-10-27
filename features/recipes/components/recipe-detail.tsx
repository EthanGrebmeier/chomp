import { useRef, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { EditableHeader } from '../../../components/editable-header';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import {
  AddToGroceryListSheet,
  AddToGroceryListSheetRef,
} from '../../shared/components';
import { useAddRecipeToList } from '../hooks/useAddRecipeToList';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { RecipeIngredient, RecipeWithIngredients } from '../types';
import {
  AddIngredientSheet,
  AddIngredientSheetRef,
} from './add-ingredient-sheet';
import { RecipeIngredientItem } from './recipe-ingredient-item';

type RecipeDetailProps = {
  recipe: RecipeWithIngredients;
  autofocus?: boolean;
};

export const RecipeDetail = ({
  recipe,
  autofocus = false,
}: RecipeDetailProps) => {
  const { mutate: addRecipeToList, isPending } = useAddRecipeToList();
  const { mutate: updateRecipe } = useUpdateRecipe();

  const textInputRef = useRef<TextInput>(null);
  const addIngredientSheetRef = useRef<AddIngredientSheetRef>(null);
  const addToGroceryListSheetRef = useRef<AddToGroceryListSheetRef>(null);
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredient | null>(null);

  const handleChangeText = (text: string) => {
    updateRecipe({ recipe: { ...recipe, name: text } });
  };

  const handleEditIngredient = (ingredient: RecipeIngredient) => {
    setEditingIngredient(ingredient);
    addIngredientSheetRef.current?.present();
  };

  const handleCloseIngredientSheet = () => {
    setEditingIngredient(null);
  };

  const handleAddRecipeToList = async (listId: string, isNewList: boolean) => {
    return new Promise<void>((resolve, reject) => {
      addRecipeToList(
        { recipeId: recipe.id, groceryListId: listId },
        {
          onSuccess: () => {
            resolve();
          },
          onError: error => {
            console.error('Failed to add recipe to grocery list:', error);
            reject(error);
          },
        }
      );
    });
  };

  return (
    <View className="flex-1 gap-4">
      {/* Header */}
      <EditableHeader
        ref={textInputRef}
        value={recipe.name}
        onChangeText={handleChangeText}
        autofocus={autofocus}
      >
        <View className="flex-row gap-4">
          <Text className="text-lg text-muted-foreground">
            {recipe.ingredients.length} ingredients
          </Text>
        </View>
      </EditableHeader>
      {recipe.description && (
        <View className="px-4">
          <Text className="text-lg text-muted-foreground">
            {recipe.description}
          </Text>
        </View>
      )}

      {/* Ingredients */}
      <View className="flex-1 ">
        <View className="mb-4 flex-row items-center justify-between px-4">
          <Text className="text-xl font-semibold">Ingredients:</Text>
        </View>
        <Animated.FlatList
          className="gap-2"
          data={recipe.ingredients}
          renderItem={({ item, index }) => (
            <RecipeIngredientItem
              className={cn(
                index < recipe.ingredients.length - 1 &&
                  'border-b border-border'
              )}
              key={item.id}
              ingredient={item}
              onEdit={handleEditIngredient}
            />
          )}
        />
      </View>
      <View className="absolute bottom-4 right-4 flex-row gap-2">
        <Button
          onPress={() => addToGroceryListSheetRef.current?.open()}
          className="flex-row items-center gap-2"
          disabled={isPending}
        >
          <Text>{isPending ? 'Adding...' : 'Add to List'}</Text>
        </Button>
        <AddIngredientSheet
          ref={addIngredientSheetRef}
          recipeId={recipe.id}
          onClose={handleCloseIngredientSheet}
          defaultValues={editingIngredient}
        />
      </View>
      <AddToGroceryListSheet
        ref={addToGroceryListSheetRef}
        onListSelected={handleAddRecipeToList}
        title="Add Recipe to Grocery List"
        createNewButtonText="Create New List & Add Recipe"
      />
    </View>
  );
};
