import { QueryClientProvider } from '@/providers/query-client-provider';
import { Tabs } from 'expo-router';
import { AppleIcon } from 'lucide-react-native';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Grocery List',
            tabBarIcon: () => <AppleIcon size={24} color="black" />,
            tabBarActiveTintColor: 'black',
          }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}
