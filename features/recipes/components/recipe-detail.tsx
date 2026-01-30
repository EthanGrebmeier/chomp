import {
  ExternalLinkIcon,
  MoreHorizontal,
  PlusIcon,
} from 'lucide-react-native';
import { Animated, Linking, Pressable, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { db } from '../../../lib/instant';
import { cn } from '../../../lib/utils';
import { NATIVE_TABS_OFFSET } from '../../shared/consts';
import { RecipeIngredient, RecipeWithIngredients } from '../types';

import {
  AddIngredientProvider,
  useAddIngredientSheet,
} from './add-ingredient-sheet';
import { RecipeDropdownMenu } from './dropdown-menu';
import { RecipeIngredientItem } from './recipe-ingredient-item';

type RecipeDetailContentProps = {
  recipe: RecipeWithIngredients;
};

const RecipeDetailContent = ({ recipe }: RecipeDetailContentProps) => {
  const { user } = db.useAuth();
  const { present } = useAddIngredientSheet();

  // Check if current user owns the recipe
  const isOwner = recipe.user?.id === user?.id;

  const handleEditIngredient = (ingredient: RecipeIngredient) => {
    present(ingredient);
  };

  return (
    <View className="pt-safe flex-1 gap-4">
      <View className="flex-row items-center justify-between  px-4">
        <BackButton />
        <RecipeDropdownMenu
          trigger={<Icon as={MoreHorizontal} size={24} />}
          recipe={recipe}
        />
      </View>
      {/* Header */}
      <View className="w-full gap-2 px-4">
        <View className="flex-row gap-4">
          <View>
            <Heading>{recipe.name}</Heading>
            {recipe.mealTag && (
              <Text className="text-lg text-muted-foreground">
                {recipe.mealTag}
              </Text>
            )}
          </View>
        </View>
      </View>
      {recipe.description && (
        <View className="px-4">
          <Text className="text-lg text-muted-foreground">
            {recipe.description}
          </Text>
        </View>
      )}
      {recipe.sourceUrl && (
        <Pressable
          className="flex-row items-center gap-1 px-4"
          onPress={() => Linking.openURL(recipe.sourceUrl!)}
        >
          <Icon as={ExternalLinkIcon} size={16} className="text-primary" />
          <Text className="text-primary">View Recipe</Text>
        </Pressable>
      )}

      {/* Ingredients */}
      <View className="flex-1 ">
        <View className="flex-row items-center justify-between px-4">
          <Text className="text-xl font-semibold">Ingredients:</Text>
        </View>
        {recipe.recipe_ingredients.length === 0 ? (
          <View
            className=" flex-1 items-center justify-center"
            style={{ marginTop: -NATIVE_TABS_OFFSET }}
          >
            <Text className="text-muted-foreground">No ingredients found</Text>
            <Text className="text-muted-foreground">
              Press the + button to add ingredients
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            className="gap-2"
            contentContainerClassName="pb-16"
            data={recipe.recipe_ingredients}
            renderItem={({ item, index }) => (
              <RecipeIngredientItem
                className={cn(
                  index < recipe.recipe_ingredients.length - 1 &&
                    'border-b border-dashed border-border'
                )}
                key={item.id}
                ingredient={item}
                onEdit={isOwner ? handleEditIngredient : undefined}
                canDelete={isOwner}
              />
            )}
          />
        )}
      </View>
      {isOwner && (
        <View className="absolute bottom-6 right-6 z-20">
          <Button size="iconLg" onPress={() => present()}>
            <Icon
              as={PlusIcon}
              size={28}
              strokeWidth={3}
              className="text-primary-foreground"
            />
          </Button>
        </View>
      )}
    </View>
  );
};

type RecipeDetailProps = {
  recipe: RecipeWithIngredients;
};

export const RecipeDetail = ({ recipe }: RecipeDetailProps) => {
  return (
    <AddIngredientProvider recipeId={recipe.id}>
      <RecipeDetailContent recipe={recipe} />
    </AddIngredientProvider>
  );
};
