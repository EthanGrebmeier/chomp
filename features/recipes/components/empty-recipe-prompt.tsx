import { Image } from 'expo-image';
import { View } from 'react-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';

import { CreateRecipeButton } from './create-recipe-button';

export const EmptyRecipePrompt = ({ listId }: { listId?: string }) => {
  return (
    <View className="flex-1 items-center justify-center px-4 py-8">
      <View className="items-center">
        <View className="w-48 ">
          <Image
            source={require('../../../assets/images/NoRecipes.png')}
            style={{
              width: 'auto',
              height: 140,
            }}
            contentFit="contain"
          />
        </View>
        <EmptyHeading className="mt-4">No recipes yet</EmptyHeading>
        <EmptySubtext className="mt-2 max-w-64">
          Save a favorite or import one from a link.
        </EmptySubtext>
        <View className="mt-5">
          <CreateRecipeButton listId={listId} label="Add recipe" />
        </View>
      </View>
    </View>
  );
};
