import { useQueryClient } from '@tanstack/react-query';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { MoreHorizontal, PlusIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Animated, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

import { EditableHeader } from '../../../components/editable-header';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { BaseGroceryItem } from '../../grocery-list/types';
import { AddItemNew } from '../../shared/add-item-new';
import { ItemSheetRef } from '../../shared/components';
import { useAddRecipeIngredient } from '../hooks/useAddRecipeIngredient';
import { useUpdateRecipe } from '../hooks/useUpdateRecipe';
import { recipeQueryKeys } from '../query-keys';
import { RecipeIngredient, RecipeWithIngredients } from '../types';

import { AddIngredientSheet } from './add-ingredient-sheet';
import { RecipeDropdownMenu } from './dropdown-menu';
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
  const { mutate: updateRecipe } = useUpdateRecipe();
  const { mutate: addIngredient } = useAddRecipeIngredient();
  const queryClient = useQueryClient();

  const textInputRef = useRef<TextInput>(null);
  const addIngredientSheetRef = useRef<ItemSheetRef>(null);
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredient | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

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

  const handleAddIngredient = (item: BaseGroceryItem) => {
    addIngredient(
      {
        recipeId: recipe.id,
        name: item.name,
        quantity: 1,
        unit: 'each',
        category: item.category ?? null,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: recipeQueryKeys.all(),
          });
          toast.success(`${item.name} added`);
        },
      }
    );
  };

  return (
    <View className="pt-safe flex-1 gap-4">
      <View className="flex-row items-center justify-between px-4">
        <BackButton />
        <RecipeDropdownMenu
          trigger={<Icon as={MoreHorizontal} size={24} />}
          recipeId={recipe.id}
          recipeName={recipe.name}
        />
      </View>
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
      <View className="absolute bottom-4 right-4 z-20">
        <Button
          size="iconLg"
          onPress={() => {
            setIsAddItemOpen(true);
          }}
        >
          <Icon
            as={PlusIcon}
            size={28}
            strokeWidth={3}
            className="text-primary-foreground"
          />
        </Button>
      </View>
      <AddIngredientSheet
        ref={addIngredientSheetRef}
        recipeId={recipe.id}
        onClose={handleCloseIngredientSheet}
        defaultValues={editingIngredient}
      />
      <AddItemNew
        isOpen={isAddItemOpen}
        setIsOpen={setIsAddItemOpen}
        onAddItem={handleAddIngredient}
      />
    </View>
  );
};
