import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function MealPlanLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}
