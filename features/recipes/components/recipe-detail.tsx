import { ExternalLinkIcon, PlusIcon } from 'lucide-react-native';
import { Linking, ScrollView, View } from 'react-native';

import { SheetHeader } from '@/components/sheet-header';
import { CloseButton } from '@/components/ui/close-button';
import { HeaderMenuTrigger } from '@/components/ui/header-action';

import { BackButton } from '../../../components/ui/back-button';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { db } from '../../../lib/instant';
import { useCategoryOptions } from '../../categories/use-category-options';
import { RecipeIngredient, RecipeWithIngredients } from '../types';

import {
  AddIngredientProvider,
  useAddIngredientSheet,
} from './add-ingredient-sheet';
import { RecipeDropdownMenu } from './dropdown-menu';
import { MealTagBadge } from './meal-tag-badge';
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

  const isOwner = recipe.user?.id === user?.id;
  const ingredients = recipe.recipe_ingredients;

  const handleEditIngredient = (ingredient: RecipeIngredient) => {
    present(ingredient);
  };

  return (
    <View className="flex-1">
      <SheetHeader
        title={recipe.name}
        backAction={!onClose ? <BackButton /> : undefined}
        closeAction={onClose ? <CloseButton onPress={onClose} /> : undefined}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-safe-offset-6 pt-2"
        keyboardDismissMode="on-drag"
      >
        {/* Overview */}
        <View className="gap-3 px-8">
          <View className="flex-row items-center justify-between gap-2">
            <MealTagBadge mealTag={recipe.mealTag} />
            <RecipeDropdownMenu
              trigger={
                <HeaderMenuTrigger accessibilityLabel="Recipe actions" />
              }
              recipe={recipe}
              listId={listId}
              onClose={onClose}
            />
          </View>
          {recipe.description ? (
            <Text variant="lead">{recipe.description}</Text>
          ) : null}
          {recipe.sourceUrl ? (
            <View className="items-start">
              <Button
                variant="ghost"
                className="h-auto px-0 py-0"
                onPress={() => Linking.openURL(recipe.sourceUrl!)}
              >
                <Text className="text-muted-foreground">Recipe source</Text>
                <Icon
                  as={ExternalLinkIcon}
                  size={16}
                  className="text-muted-foreground"
                />
              </Button>
            </View>
          ) : null}
          {isOwner ? (
            <View className="items-start pt-1">
              <RecipeAddToListButton recipe={recipe} listId={listId} />
            </View>
          ) : null}
        </View>

        {/* Ingredients */}
        <View className="gap-1">
          <View className="h-9 flex-row items-center justify-between px-8">
            <Text variant="overline">Ingredients</Text>
            {isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3"
                onPress={() => present()}
              >
                <Icon
                  as={PlusIcon}
                  size={16}
                  strokeWidth={3}
                  className="text-foreground"
                />
                <Text>Add</Text>
              </Button>
            ) : null}
          </View>
          {ingredients.length === 0 ? (
            <View className="items-center gap-1 px-8 py-8">
              <Text variant="bodyMuted">No ingredients yet</Text>
              {isOwner ? (
                <Text variant="caption">Tap Add to add ingredients</Text>
              ) : null}
            </View>
          ) : (
            ingredients.map(ingredient => (
              <RecipeIngredientItem
                className="px-8"
                key={ingredient.id}
                ingredient={ingredient}
                categoryOptions={categoryOptions}
                onEdit={isOwner ? handleEditIngredient : undefined}
                canDelete={isOwner}
              />
            ))
          )}
        </View>
      </ScrollView>
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
