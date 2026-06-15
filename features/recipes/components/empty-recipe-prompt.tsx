import { Image } from 'expo-image';
import { View } from 'react-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';

export const EmptyRecipePrompt = () => {
  return (
    <View className="items-center justify-center  px-4">
      <View className="-translate-y-12 items-center">
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
        <EmptySubtext>Create your first recipe to get started!</EmptySubtext>
      </View>
    </View>
  );
};
