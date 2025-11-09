import { navigation } from '@/lib/navigation';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { EditableHeader } from '../../../components/editable-header';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { AddToGroceryListSheetRef } from '../../shared/components';
import { useAddRecipeToList } from '../hooks/useAddRecipeToList';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { RecipeIngredient, RecipeWithIngredients } from '../types';
import {
  AddIngredientSheet,
  AddIngredientSheetRef,
} from './add-ingredient-sheet';
import RecipeImage from './recipe-image';
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

  const handleAddRecipeToList = async () => {
    addRecipeToList(
      { recipeId: recipe.id },
      {
        onSuccess: () => {
          router.push(navigation.goToList());
        },
        onError: error => {
          console.error('Failed to add recipe to grocery list:', error);
        },
      }
    );
  };

  const handleSelectImage = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });

    if (result.assets?.[0]) {
      updateRecipe({ recipe: { ...recipe, imageSrc: result.assets[0].uri } });
    }
  };

  return (
    <View className="flex-1 gap-4">
      {/* Header */}
      <View className="w-full flex-row gap-1 px-4">
        <RecipeImage
          imageSrc={recipe.imageSrc}
          onSelectImage={handleSelectImage}
        />
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
      </View>
      {recipe.description && (
        <View className="px-4">
          <Text className="text-lg text-muted-foreground">
            {recipe.description}
          </Text>
        </View>
      )}

      {/* Ingredients */}
      <View className="flex-1 ">
        <View className="flex-row items-center justify-between px-4">
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
          onPress={handleAddRecipeToList}
          className="flex-row items-center gap-2"
          disabled={isPending}
          size="sm"
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
    </View>
  );
};
