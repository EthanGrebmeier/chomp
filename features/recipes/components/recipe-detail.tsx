import { useRef, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { EditableHeader } from '../../../components/editable-header';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useAddRecipeToList } from '../hooks/useAddRecipeToList';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { RecipeIngredientWithItem, RecipeWithIngredients } from '../types';
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
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredientWithItem | null>(null);

  const handleChangeText = (text: string) => {
    updateRecipe({ recipe: { ...recipe, name: text } });
  };

  const handleEditIngredient = (ingredient: RecipeIngredientWithItem) => {
    setEditingIngredient({
      ...ingredient,
      item: ingredient.item,
    });
    addIngredientSheetRef.current?.present();
  };

  const handleCloseIngredientSheet = () => {
    setEditingIngredient(null);
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
          {recipe.servings && (
            <Text className="text-lg text-muted-foreground">
              Serves {recipe.servings}
            </Text>
          )}
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
          <AddIngredientSheet
            ref={addIngredientSheetRef}
            recipeId={recipe.id}
            onClose={handleCloseIngredientSheet}
            defaultValues={editingIngredient}
          />
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
    </View>
  );
};
