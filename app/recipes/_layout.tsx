import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecipesLayout() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SafeAreaView>
    </View>
  );
}
