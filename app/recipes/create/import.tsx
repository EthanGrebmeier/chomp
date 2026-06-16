import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ImportRecipePageFlow } from '@/features/recipes/components/import/import-recipe-page-flow';
import { useImportRecipeFlow } from '@/features/recipes/hooks/useImportRecipeFlow';
import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';
import { navigation } from '@/lib/navigation';

const firstParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

const getTitle = (status: ReturnType<typeof useImportRecipeFlow>['state']['status']) => {
  switch (status) {
    case 'loading':
      return 'Importing Recipe';
    case 'error':
      return 'Import Failed';
    case 'preview':
      return 'Review Recipe';
    case 'saving':
      return 'Creating Recipe';
    case 'success':
      return 'Success';
    default:
      return 'Import Recipe';
  }
};

const GuestImportPrompt = () => {
  const handleCreateAccount = () => {
    router.dismissTo('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 justify-center gap-6 px-4">
      <View className="gap-2">
        <Text className="text-center text-2xl font-bold text-foreground">
          Create an Account
        </Text>
        <Text className="text-center text-lg font-semibold text-foreground">
          AI recipe import is for signed-in accounts
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Create an account to import recipes from a URL and keep your recipes
          synced across devices.
        </Text>
      </View>
      <View className="gap-2">
        <Button size="xl" onPress={handleCreateAccount}>
          <Text>Create Account</Text>
        </Button>
        <Button size="xl" variant="outline" onPress={() => router.back()}>
          <Text>Maybe Later</Text>
        </Button>
      </View>
    </View>
  );
};

export default function ImportRecipePage() {
  const params = useLocalSearchParams<{ listId?: string | string[] }>();
  const listId = firstParam(params.listId);
  const { status } = useInstantAuthState();
  const flow = useImportRecipeFlow({
    onImportSuccess: recipeId => {
      router.replace(navigation.goToRecipe(recipeId, listId));
    },
  });

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (status !== 'signed-in') {
    return (
      <View className="flex-1 bg-background">
        <GuestImportPrompt />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-4 pb-10"
      >
        <View className="mb-4 flex-row items-center">
          <View className="w-12 items-start">
            <BackButton />
          </View>
          <View className="mx-2 flex-1">
            <Text className="text-center text-2xl font-bold">
              {getTitle(flow.state.status)}
            </Text>
          </View>
          <View className="w-12" />
        </View>

        <ImportRecipePageFlow flow={flow} onCancel={() => router.back()} />
      </ScrollView>
    </View>
  );
}
