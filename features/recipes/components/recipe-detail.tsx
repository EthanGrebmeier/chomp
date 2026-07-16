import {
  ExternalLinkIcon,
  MoreHorizontal,
  PlusIcon,
} from 'lucide-react-native';
import { Animated, Linking, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { db } from '../../../lib/instant';
import { cn } from '../../../lib/utils';
import { useCategoryOptions } from '../../categories/use-category-options';
import { RecipeIngredient, RecipeWithIngredients } from '../types';

import {
  AddIngredientProvider,
  useAddIngredientSheet,
} from './add-ingredient-sheet';
import { RecipeDropdownMenu } from './dropdown-menu';
import { RecipeAddToListButton } from './recipe-add-to-list-button';
import { RecipeIngredientItem } from './recipe-ingredient-item';

type RecipeDetailContentProps = {
  recipe: RecipeWithIngredients;
  listId?: string;
  onClose?: () => void;
};

const RecipeDetailContent = ({
  recipe,
  listId,
  onClose,
}: RecipeDetailContentProps) => {
  const { user } = db.useAuth();
  const { present } = useAddIngredientSheet();
  const { data: categoryOptions } = useCategoryOptions();

  // Check if current user owns the recipe
  const isOwner = recipe.user?.id === user?.id;

  const handleEditIngredient = (ingredient: RecipeIngredient) => {
    present(ingredient);
  };

  return (
    <View className="flex-1 gap-4">
      <View className="relative min-h-10 px-4">
        <View className="absolute left-4 top-0 z-10">
          <BackButton onPress={onClose} />
        </View>
        <Heading className="px-14 text-center">{recipe.name}</Heading>
        <View className="absolute right-4 top-0">
          <RecipeDropdownMenu
            trigger={
              <View className="z-10 size-8 items-center justify-center rounded-full bg-background">
                <Icon as={MoreHorizontal} size={24} />
              </View>
            }
            recipe={recipe}
            onClose={onClose}
          />
        </View>
      </View>
      {/* Header */}
      <View className="w-full gap-2 px-4">
        <View className="flex-row gap-4">
          <View>
            {recipe.mealTag ? (
              <Text variant="caption">{recipe.mealTag}</Text>
            ) : null}
          </View>
        </View>
      </View>
      {recipe.description ? (
        <View className="px-4">
          <Text variant="lead">{recipe.description}</Text>
        </View>
      ) : null}
      {recipe.sourceUrl ? (
        <View className="items-start px-4">
          <Button
            variant="ghost"
            className="px-0"
            onPress={() => Linking.openURL(recipe.sourceUrl!)}
          >
            <Text>Recipe Source</Text>
            <Icon
              as={ExternalLinkIcon}
              size={16}
              className="text-muted-foreground"
            />
          </Button>
        </View>
      ) : null}

      {/* Ingredients */}
      <View className="flex-1 ">
        <View className="flex-row items-center justify-between px-4">
          <Text variant="overline">Ingredients</Text>
        </View>
        {recipe.recipe_ingredients.length === 0 ? (
          <View className=" flex-1 items-center justify-center">
            <Text variant="bodyMuted">No ingredients found</Text>
            <Text variant="bodyMuted">
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
                categoryOptions={categoryOptions}
                onEdit={isOwner ? handleEditIngredient : undefined}
                canDelete={isOwner}
              />
            )}
          />
        )}
      </View>
      {isOwner && <RecipeAddToListButton recipe={recipe} listId={listId} />}
      {isOwner && (
        <View className="bottom-safe absolute right-6 z-20">
          <Button size="wide-small" onPress={() => present()}>
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
  listId?: string;
  onClose?: () => void;
};

export const RecipeDetail = ({
  recipe,
  listId,
  onClose,
}: RecipeDetailProps) => {
  return (
    <AddIngredientProvider recipeId={recipe.id}>
      <RecipeDetailContent recipe={recipe} listId={listId} onClose={onClose} />
    </AddIngredientProvider>
  );
};
