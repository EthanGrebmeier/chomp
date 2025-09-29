import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Recipes() {
  return (
    <View>
      <SafeAreaView>
        <View className="px-4">
          <Text className="text-2xl font-bold">Recipes</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
