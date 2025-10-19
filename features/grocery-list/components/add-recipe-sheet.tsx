import { Button } from '@/components/ui/button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { useAddRecipeToList } from '../../recipes/hooks/useAddRecipeToList';
import { RecipeWithIngredients } from '../../recipes/types';

type AddRecipeSheetProps = {
  groceryListId: string;
};

export const AddRecipeSheet = ({ groceryListId }: AddRecipeSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { mutate: addRecipeToList, isPending } = useAddRecipeToList();

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    addRecipeToList(
      {
        recipeId: recipe.id,
        groceryListId,
      },
      {
        onSuccess: () => {
          ref.current?.dismiss();
        },
      }
    );
  };

  return (
    <>
      <Button onPress={() => ref.current?.present()}>
        <Text>Add Recipe</Text>
      </Button>
      <BottomSheet onStartClose={() => KeyboardController.dismiss()} ref={ref}>
        <RecipeSearch
          sheetRef={ref}
          canGoBack={false}
          onItemSelect={handleRecipeSelect}
          onBack={() => {}}
        />
      </BottomSheet>
    </>
  );
};
