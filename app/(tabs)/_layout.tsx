import { Tabs } from 'expo-router';
import { ScrollIcon } from 'lucide-react-native';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lists',
          tabBarIcon: () => <ScrollIcon size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="[listId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: () => <ScrollIcon size={24} color="black" />,
        }}
      />
    </Tabs>
  );
}
